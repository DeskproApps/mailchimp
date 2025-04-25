import { IDeskproClient } from '@deskpro/app-sdk';
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
import { baseRequest } from './baseRequest';

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

type GetMemberListsResponse = {
  exact_matches: {
    members: [];
  };
};

export const getMemberLists = async (client: IDeskproClient, email: string): Promise<Member[]|null> => {
  try {
    const data = await baseRequest<GetMemberListsResponse>({
      client,
      endpoint: `/search-members?query=${email}`
    });

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

type GetAudiencesResponse = {
  lists: [];
};

export const getAudiences = async (client: IDeskproClient, email?: string): Promise<AudienceList> => {
  try {
    const data = await baseRequest<GetAudiencesResponse>({
      client,
      endpoint: `/lists?offset=0&count=1000${email && `&email=${email}`}`
    });

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

type UpdateAudienceSubscriptionResponse = {
  errors: {error: string}[];
  updated_members: {id: string}[];
};

type MemberDataResponse = {
  marketing_permissions: {marketing_permission_id: string}[];
};

export const updateAudienceSubscription = async (client: IDeskproClient, audienceId: string, email: string, status: AudienceStatus): Promise<boolean|string[]> => {
  try {
    const data = await baseRequest<UpdateAudienceSubscriptionResponse>({
      client,
      method: 'POST',
      endpoint: `/lists/${audienceId}?skip_merge_validation=true&skip_duplicate_check=true`,
      data: {
        update_existing: true,
        members: [{
          email_address: email,
          status: status,
        }]
      }
    })

    if ((data?.errors ?? []).length) {
      return (data?.errors ?? []).map((e: { error: string }) => e.error);
    }

    if (status === "subscribed" && data?.updated_members[0]?.id) {
      const memberId: string = data.updated_members[0].id;

      const memberData = await baseRequest<MemberDataResponse>({
        client,
        endpoint: `/lists/${audienceId}/members/${memberId}`
      });
      const marketingPermissionIds = (memberData?.marketing_permissions ?? [])
          .map((p: { marketing_permission_id: string; }) => p.marketing_permission_id)
      ;

      if (marketingPermissionIds.length) {
        await enableAllMarketingPermissions(client, audienceId, memberId, marketingPermissionIds);
      }
    }

    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Failed to update audience subscription status in Mailchimp: ${e}`);
    
    return false;
  };
}

export const subscribeNewAudienceMember = async (client: IDeskproClient, audienceId: string, email: string, name: UserName): Promise<boolean|string[]> => {
  try {
    const emailParsed = email.trim().toLowerCase();
    const subscriberHash = Md5.hashStr(emailParsed);

    const data = await baseRequest<MemberDataResponse>({
      client,
      method: 'PUT',
      endpoint: `/lists/${audienceId}/members/${subscriberHash}`,
      data: {
        email_address: emailParsed,
        status: "subscribed",
        merge_fields: {
          FNAME: name.first,
          LNAME: name.last,
        }
      }
    });

    if (data?.marketing_permissions && Array.isArray(data.marketing_permissions)) {
      await enableAllMarketingPermissions(
        client,
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

type GetCampaignActivityResponse = {
  campaigns: {
    id: string;
    status: keyof typeof campaignActivityImportanceMap;
    send_time: string;
    web_id: number;
    settings: {
      title: string;
      subject_line: string;
    }
  }[];
};

type ActivitiesResponse = {
  activity: {
    action: CampaignActivityAction;
    timestamp: string;
  }[];
};

export const getCampaignActivity = async (client: IDeskproClient, members: Member[]): Promise<CampaignActivities|null> => {
  const allActivities: CampaignActivities = [];

  try {
    const requests = members.map(async (member: Member) => {
      const resultActivities: CampaignActivities = [];

      const campaigns = await baseRequest<GetCampaignActivityResponse>({
        client,
        endpoint: `/campaigns/?offset=0&count=1000&member_id=${member.id}`
      });

      const subscriberHash = Md5.hashStr(member.email.toLowerCase());

      for (const campaign of (campaigns.campaigns ?? [])) {
        const activities = await baseRequest<ActivitiesResponse>({
          client,
          endpoint: `/reports/${campaign.id}/email-activity/${subscriberHash}`
        });

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
  client: IDeskproClient,
  audienceId: string,
  subscriberHash: string,
  marketingPermissionIds: string[]
): Promise<void> => {
  try {
    await baseRequest({
      client,
      method: 'PUT',
      endpoint: `/lists/${audienceId}/members/${subscriberHash}`,
      data: {
        marketing_permissions: marketingPermissionIds.map((id) => ({
          marketing_permission_id: id,
          enabled: true,
        }))
      }
    });
  } catch (error) {
    throw new Error("Failed to enable all member marketing preferences");
  };
};

export const setMarketingPermissions = async (client: IDeskproClient, audienceId: string, memberId: string, permissions: Record<string, boolean>) => {
  try {
    await baseRequest({
      client,
      method: 'PUT',
      endpoint: `/lists/${audienceId}/members/${memberId}`,
      data: {
        marketing_permissions: Object.keys(permissions).map((id) => ({
          marketing_permission_id: id,
          enabled: permissions[id],
        })),
      }
    });
  } catch (error) {
    throw new Error("Failed to set member marketing preferences");
  };
};

export const archiveMember = async (client: IDeskproClient, audienceId: string, memberId: string) => {
  try {
    await baseRequest({
      client,
      method: 'DELETE',
      endpoint: `/lists/${audienceId}/members/${memberId}`
    });
  } catch (error) {
    throw new Error("Failed to archive member");
  };
};

export const checkAuth = async (client: IDeskproClient): Promise<boolean> => {
  try {
    await baseRequest({
      client,
      endpoint: '/ping'
    });

    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`failed to check auth: ${e}`);
    return false;
  }
};