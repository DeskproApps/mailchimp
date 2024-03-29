import React, { FC, Fragment } from "react";
import { AnyIcon, Icon, Pill, Stack } from "@deskpro/deskpro-ui";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import { CampaignActivity } from "../../api/types";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons";

export interface CampaignActionProps {
  activity: CampaignActivity;
}

export const CampaignAction: FC<CampaignActionProps> = ({ activity }: CampaignActionProps) => {
  const { theme } = useDeskproAppTheme();

  const colorMap = {
    "save": theme.colors.systemShade80,
    "paused": theme.colors.orange100,
    "schedule": theme.colors.grey100,
    "sending": theme.colors.turquoise100,
    "canceled": theme.colors.grey100,
    "canceling": theme.colors.grey100,
    "archived": theme.colors.grey80,
    "sent": theme.colors.green100,
    "open": theme.colors.brandShade100,
    "click": theme.colors.cyan100,
    "bounce": theme.colors.amethyst100,
  };

  return (
    <Stack gap={2} align="center">
      {activity.actions.map((action, idx) => (
        <Fragment key={idx}>
          {idx !== 0 && <Icon icon={faAngleLeft as AnyIcon} className="external-link-mailchimp-icon" themeColor="grey40" />}
          <Pill
            textColor={theme.colors.white}
            backgroundColor={colorMap[action]}
            label={action}
          />
        </Fragment>
      ))}
    </Stack>
  );
};
