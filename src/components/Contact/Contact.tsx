import React, { FC } from "react";
import { SectionHeading } from "../SectionHeading/SectionHeading";
import { Property } from "../Property/Property";
import { SectionBlock } from "../SectionBlock/SectionBlock";
import "./Contact.css";

export interface ContactProps {
  userEmail: string|null;
}

export const Contact: FC<ContactProps> = ({ userEmail }: ContactProps) => {
  return (
    <>
      <SectionBlock justify={"space-between"} align={"center"}>
        <SectionHeading text="Contact" />
      </SectionBlock>
      <SectionBlock>
        <Property title="Email">
          {userEmail}
        </Property>
      </SectionBlock>
    </>
  );
};
