import { Fetch, IDeskproClient, proxyFetch } from "@deskpro/app-sdk";
import {
  AudienceList,
  AudienceStatus,
  CampaignActivities,
  CampaignActivityAction,
  Member
} from "./types";
import { Md5 } from "ts-md5/dist/md5";
import { orderBy, uniqBy } from "lodash";
import {UserName} from "../types";

const MAILCHIMP_API_BASE_URL = "https://x:__api_key__@__domain__.api.mailchimp.com/3.0";

const maxCampaignStatuses = 3;

const campaignActivityImportanceMap = {
  "save": 20,
  "paused": 30,
  "schedule": 40,
  "sending": 50,
  "canceled": 70,
  "canceling": 80,
  "archived": 90,
  "sent": 60,
  "open": 100,
  "click": 120,
  "bounce": 120,
};

const campaignActivityImportanceActions = (
  actions: CampaignActivityAction[]|{ action: CampaignActivityAction, timestamp: string }[],
  campaignDate: Date,
  campaignStatus: CampaignActivityAction
): [CampaignActivityAction[], Date|null] => {
  let mapped = [];

  mapped.push({
    status: campaignStatus,
    date: campaignDate,
    order: campaignActivityImportanceMap[campaignStatus],
  });

  for (const item of actions) {
    if (typeof item !== "string") {
      mapped.push({
        status: item.action,
        date: new Date(item.timestamp),
        order: campaignActivityImportanceMap[item.action],
      });
    }
  }

  // Order by latest first, then remove duplicates so we're left with the most recent
  mapped = orderBy(mapped, (i) => i.date, ["desc"]);
  mapped = uniqBy(mapped, (i) => i.status);

  // Order by status ordering map
  mapped = orderBy(mapped, (i) => i.order, ["desc"]);

  // Limit results
  mapped = mapped.slice(0, maxCampaignStatuses);

  return [
    mapped.map((a) => a.status),
    mapped[0] ? mapped[0].date : null,
  ];
};

export const getMemberLists = async (client: IDeskproClient, email: string): Promise<Member[]|null> => {
  const dpFetch = await proxyFetch(client);

  try {
    const response = await dpFetch(`${MAILCHIMP_API_BASE_URL}/search-members?query=${email}`);
    const data = await response.json();

    if (!data.exact_matches.members) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.exact_matches.members ?? []).map((m: any) => ({
      id: m.id,
      webId: m.web_id,
      email: m.email_address,
      fullName: m.full_name,
      rating: m.member_rating,
      status: m.status,
      listId: m.list_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      marketingPermissions: (m.marketing_permissions ?? []).map((p: any) => ({
        id: p.marketing_permission_id,
        text: p.text,
        enabled: p.enabled,
      })),
    } as Member));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch member lists from Mailchimp: ${e}`, e);
    return null;
  }
};

export const getAudiences = async (client: IDeskproClient, email?: string): Promise<AudienceList> => {
  const dpFetch = await proxyFetch(client);

  try {
    const response = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists?offset=0&count=1000${email && `&email=${email}`}`);

    const data = await response.json();

    if (!data.lists) {
      return [];
    }

    return data.lists.map((list: {id: string, name: string, web_id: number, marketing_permissions: boolean|unknown}) => ({
      id: list.id,
      webId: list.web_id,
      name: list.name,
      hasMarketingPreferences: !!list.marketing_permissions,
    }));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch audiences from Mailchimp: ${e}`);
    return [];
  }
}

export const updateAudienceSubscription = async (client: IDeskproClient, audienceId: string, email: string, status: AudienceStatus): Promise<boolean|string[]> => {
  const dpFetch = await proxyFetch(client);

  try {
    const res = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists/${audienceId}?skip_merge_validation=true&skip_duplicate_check=true`, {
      method: "POST",
      body: JSON.stringify({
        update_existing: true,
        members: [{
          email_address: email,
          status: status,
        }],
      }),
    });

    const data = await res.json();

    if ((data?.errors ?? []).length) {
      return (data?.errors ?? []).map((e: { error: string }) => e.error);
    }

    if (status === "subscribed" && data?.updated_members[0]?.id) {
      const memberId: string = data.updated_members[0].id;

      const memberRes = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists/${audienceId}/members/${memberId}`);

      if (memberRes.status !== 200) {
        return false;
      }

      const memberData = await memberRes.json();
      const marketingPermissionIds = (memberData?.marketing_permissions ?? [])
          .map((p: { marketing_permission_id: string; }) => p.marketing_permission_id)
      ;

      if (marketingPermissionIds.length) {
        await enableAllMarketingPermissions(dpFetch, audienceId, memberId, marketingPermissionIds);
      }
    }

    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to update audience subscription status in Mailchimp: ${e}`);
  }

  return false;
}

export const subscribeNewAudienceMember = async (client: IDeskproClient, audienceId: string, email: string, name: UserName): Promise<boolean|string[]> => {
  const dpFetch = await proxyFetch(client);

  try {
    const emailParsed = email.trim().toLowerCase();
    const subscriberHash = Md5.hashStr(emailParsed);

    const res = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists/${audienceId}/members/${subscriberHash}`, {
      method: "PUT",
      body: JSON.stringify({
        email_address: emailParsed,
        status: "subscribed",
        merge_fields: {
          FNAME: name.first,
          LNAME: name.last,
        },
      }),
    });

    if (res.status === 400) {
      const errorData = await res.json();

      if (errorData.detail) {
        return [errorData.detail];
      }

      return false;
    }

    const data = await res.json();

    if (data?.marketing_permissions && Array.isArray(data.marketing_permissions)) {
      await enableAllMarketingPermissions(
        dpFetch,
        audienceId,
        subscriberHash,
        data.marketing_permissions.map((p: {marketing_permission_id: string}) => p.marketing_permission_id)
      );
    }

    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to subscribe new member: ${e}`);
    return false;
  }
};

export const getCampaignActivity = async (client: IDeskproClient, members: Member[]): Promise<CampaignActivities|null> => {
  const dpFetch = await proxyFetch(client);

  const allActivities: CampaignActivities = [];

  try {
    const requests = members.map(async (member: Member) => {
      const resultActivities: CampaignActivities = [];

      const campaignsResponse = await dpFetch(`${MAILCHIMP_API_BASE_URL}/campaigns/?offset=0&count=1000&member_id=${member.id}`);
      const campaigns = await campaignsResponse.json();

      const subscriberHash = Md5.hashStr(member.email.toLowerCase());

      for (const campaign of (campaigns.campaigns ?? [])) {
        const activityResponse = await dpFetch(`${MAILCHIMP_API_BASE_URL}/reports/${campaign.id}/email-activity/${subscriberHash}`);
        const activities = await activityResponse.json();

        const events = activities.activity ?? [];

        const [actions, date] = campaignActivityImportanceActions(events.length === 0
                ? [campaign.status]
                : events,
            new Date(campaign.send_time),
            campaign.status
        );

        resultActivities.push({
          id: campaign.id,
          webId: campaign.web_id,
          name: campaign.settings.title ?? campaign.settings.subject_line,
          actions,
          date,
          uniqueKey: (date?.toISOString() ?? "") + campaign.id,
        });
      }

      return resultActivities;
    });

    (await Promise.all(requests))
        .forEach((as) => as.forEach((a) => allActivities.push(a)))
    ;

    return orderBy(uniqBy(allActivities, 'uniqueKey'), (item) => item.date, ['desc']);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to fetch campaigns from Mailchimp: ${e}`);
    return null;
  }
};

export const enableAllMarketingPermissions = async (
  dpFetch: Fetch,
  audienceId: string,
  subscriberHash: string,
  marketingPermissionIds: string[]
): Promise<void> => {
  const res = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists/${audienceId}/members/${subscriberHash}`, {
    method: "PUT",
    body: JSON.stringify({
      marketing_permissions: marketingPermissionIds.map((id) => ({
        marketing_permission_id: id,
        enabled: true,
      })),
    }),
  });

  if (res.status !== 200) {
    throw new Error("Failed to enable all member marketing preferences");
  }
};

export const setMarketingPermissions = async (client: IDeskproClient, audienceId: string, memberId: string, permissions: Record<string, boolean>) => {
  const dpFetch = await proxyFetch(client);

  const res = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists/${audienceId}/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify({
      marketing_permissions: Object.keys(permissions).map((id) => ({
        marketing_permission_id: id,
        enabled: permissions[id],
      })),
    }),
  });

  if (res.status !== 200) {
    throw new Error("Failed to set member marketing preferences");
  }
};

export const archiveMember = async (client: IDeskproClient, audienceId: string, memberId: string) => {
  const dpFetch = await proxyFetch(client);

  const res = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists/${audienceId}/members/${memberId}`, {
    method: "DELETE",
  });

  if (res.status !== 204) {
    throw new Error("Failed to archive member");
  }
};
