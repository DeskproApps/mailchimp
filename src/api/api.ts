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

export const getMember = async (client: IDeskproClient, email: string): Promise<Member|null> => {
  const dpFetch = await proxyFetch(client);

  try {
    const response = await dpFetch(`${MAILCHIMP_API_BASE_URL}/search-members?query=${email}`);
    const data = await response.json();

    if (!data.exact_matches.members) {
      return null;
    }

    if (data.exact_matches.members.length !== 1) {
      return null;
    }

    const member = data.exact_matches.members.pop();

    return {
      id: member.id,
      webId: member.web_id,
      email: member.email_address,
      fullName: member.full_name,
      rating: member.member_rating,
      status: member.status,
    };
  } catch (e) {
    console.error(`Failed to fetch member details from Mailchimp: ${e}`, e);
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
    console.error(`Failed to fetch audiences from Mailchimp: ${e}`);
    return [];
  }
}

export const updateAudienceSubscription = async (client: IDeskproClient, audienceId: string, email: string, status: AudienceStatus): Promise<void> => {
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
  } catch (e) {
    console.error(`Failed to update audience subscription status in Mailchimp: ${e}`);
  }
}

export const subscribeNewAudienceMember = async (client: IDeskproClient, audienceId: string, email: string, name: string): Promise<boolean|string[]> => {
  const dpFetch = await proxyFetch(client);
  const nameParts = name.split(" ");

  try {
    const subscriberHash = Md5.hashStr(email.toLowerCase());

    const res = await dpFetch(`${MAILCHIMP_API_BASE_URL}/lists/${audienceId}/members/${subscriberHash}`, {
      method: "PUT",
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: nameParts[0],
          LNAME: nameParts[1] ?? "",
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
    console.error(`Failed to subscribe new member: ${e}`);
    return false;
  }
};

export const getCampaignActivity = async (client: IDeskproClient, member: Member): Promise<CampaignActivities|null> => {
  const dpFetch = await proxyFetch(client);

  try {
    const campaignsResponse = await dpFetch(`${MAILCHIMP_API_BASE_URL}/campaigns/?offset=0&count=1000&member_id=${member.id}`);
    const campaigns = await campaignsResponse.json();

    const subscriberHash = Md5.hashStr(member.email.toLowerCase());

    const allActivities: CampaignActivities = [];

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

      allActivities.push({
        id: campaign.id,
        webId: campaign.web_id,
        name: campaign.settings.title ?? campaign.settings.subject_line,
        actions,
        date,
      });
    }

    return orderBy(allActivities, (item) => item.date, ['desc']);
  } catch (e) {
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
