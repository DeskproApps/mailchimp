import React, { FC, ReactNode } from "react";
import { H2, Stack } from "@deskpro/deskpro-ui";
import { useDeskproAppTheme } from "@deskpro/app-sdk";
import "./Property.css";

export interface PropertyProps {
  children: JSX.Element | ReactNode;
  title?: string;
  width?: string;
}

export const Property: FC<PropertyProps> = ({ title, children, width }: PropertyProps) => {
  const { theme } = useDeskproAppTheme();

  return (
    <Stack vertical style={{ width: width ?? "auto" }}>
      {title && <H2 style={{ color: theme.colors.grey80 }}>{title}</H2>}
      <div className="property-value">{children}</div>
    </Stack>
  );
};
