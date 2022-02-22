export type MemberStatus = "subscribed" | "unsubscribed" | "cleaned" | "pending" | "transactional" | "archived";

export interface Member {
  id: string;
  webId: number;
  email: string;
  fullName: string;
  rating: number;
  status: MemberStatus;
  listId: string;
}

export interface Audience {
  id: string;
  webId: number;
  name: string;
  hasMarketingPreferences: boolean;
}

export type AudienceList = Audience[];

export type AudienceStatus = "subscribed" | "unsubscribed";

export type CampaignActivityAction = "save"
  | "paused"
  | "schedule"
  | "sending"
  | "canceled"
  | "canceling"
  | "archived"
  | "sent"
  | "open"
  | "click"
  | "bounce"
;

export interface CampaignActivity {
  id: string;
  webId: number;
  name: string;
  actions: CampaignActivityAction[];
  date: Date|null;
}

export type CampaignActivities = CampaignActivity[];
