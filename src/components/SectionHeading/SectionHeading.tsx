import React, { FC } from "react";
import { H0 } from "@deskpro/app-sdk";

export interface SectionHeadingProps {
  text: string;
}

export const SectionHeading: FC<SectionHeadingProps> = ({ text }: SectionHeadingProps) => (
  <H0 style={{ fontSize: "13px" }}>{text}</H0>
);
