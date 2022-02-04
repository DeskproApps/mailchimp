import React, { FC, useEffect, useState } from "react";
import { SectionBlock } from "../SectionBlock/SectionBlock";
import { SectionHeading } from "../SectionHeading/SectionHeading";
import { ExternalLink } from "../ExternalLink/ExternalLink";
import { Property } from "../Property/Property";
import {
  Stack,
  H1,
  useDeskproAppClient,
  Spinner
} from "@deskpro/app-sdk";
import { HorizontalDivider, VerticalDivider } from "../Divider/Divider";
import "./Campaigns.css";
import { CampaignActivities, Member } from "../../api/types";
import { getCampaignActivity } from "../../api/api";
import { CampaignAction } from "../CampaignAction/CampaignAction";

export interface CampaignsProps {
  member: Member|null;
  settings: { domain?: string; };
}

export const Campaigns: FC<CampaignsProps> = ({ member, settings }: CampaignsProps) => {
  const [campaignActivities, setCampaignActivities] = useState<CampaignActivities|undefined>(undefined);
  const { client } = useDeskproAppClient();

  useEffect(() => {
    if (!client || !member) {
      return;
    }

    getCampaignActivity(client, member)
      .then((activities) => activities && setCampaignActivities(activities))
    ;
  }, [client, member]);

  if (!member) {
    return (<></>);
  }

  if (campaignActivities === undefined) {
    return (
      <SectionBlock justify="center">
        <Spinner size="small" />
      </SectionBlock>
    );
  }

  return (
    <>
      <SectionBlock justify={"space-between"} align={"center"}>
        <SectionHeading text={`Campaigns (${campaignActivities.length})`} />
        <ExternalLink href={`https://${settings.domain}.admin.mailchimp.com/campaigns/#f_list:all;f_assigned:unassigned;t:campaigns-list`} />
      </SectionBlock>
      <>
        {campaignActivities.map((activity, idx) => (
          <div className="campaign-row" key={idx}>
            <Stack vertical>
              <SectionBlock align="center">
                <H1>{activity.name}</H1>
                <ExternalLink href={`https://${settings.domain}.admin.mailchimp.com/campaigns/show?id=${activity.webId}`} />
              </SectionBlock>
              <SectionBlock align="stretch" style={{ width: "100%" }}>
                <Property width="64%">
                  <div className="status-pill-container">
                    <CampaignAction activity={activity} />
                  </div>
                </Property>
                <VerticalDivider />
                {activity.date && (
                  <Property>
                    {activity.date.toLocaleDateString()}
                  </Property>
                )}
              </SectionBlock>
            </Stack>
            <HorizontalDivider />
          </div>
        ))}
      </>
    </>
  );
};
