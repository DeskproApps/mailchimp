import React, { CSSProperties, FC } from "react";
import { Stack, StackProps } from "@deskpro/deskpro-ui";

export type SectionBlockProps = StackProps & {
  style?: CSSProperties;
};

export const SectionBlock: FC<SectionBlockProps> = (props: SectionBlockProps) => (
  <Stack {...props} style={{ marginBottom: "10px", ...(props.style ?? {}) }} />
);
