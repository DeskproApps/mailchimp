import React, { FC } from "react";
import { Pill, useDeskproAppTheme } from "@deskpro/app-sdk";
import { MemberStatus as MemberStatusType } from "../../api/types";

export interface MemberStatusProps {
  status: MemberStatusType;
}

export const MemberStatus: FC<MemberStatusProps> = ({ status }: MemberStatusProps) => {
  const { theme } = useDeskproAppTheme();

  const colorMap = {
    "subscribed": theme.colors.green100,
    "unsubscribed": theme.colors.grey80,
    "cleaned": theme.colors.amethyst100,
    "pending": theme.colors.orange100,
    "transactional": theme.colors.brandShade100,
    "archived": theme.colors.grey100,
  };

  return (
    <Pill
      textColor={theme.colors.white}
      backgroundColor={colorMap[status]}
      label={status}
    />
  );
};
