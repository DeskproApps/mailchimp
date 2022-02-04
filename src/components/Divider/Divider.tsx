import React, { FC } from "react";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import "./Divider.css";

export interface VerticalDividerProps {
  width?: number;
}

export const VerticalDivider: FC<VerticalDividerProps> = ({ width }: VerticalDividerProps) => {
  const { theme } = useDeskproAppTheme();

  return (
    <div className="vertical-divider" style={{ backgroundColor: theme.colors.grey20, width: `${width ?? 2}px` }} />
  );
};

export interface HorizontalDividerProps {
  width?: number;
}

export const HorizontalDivider: FC<HorizontalDividerProps> = ({ width }: HorizontalDividerProps) => {
  const { theme } = useDeskproAppTheme();

  return (
    <div className="horizontal-divider" style={{ backgroundColor: theme.colors.grey10, height: `${width ?? 1}px` }} />
  );
};
