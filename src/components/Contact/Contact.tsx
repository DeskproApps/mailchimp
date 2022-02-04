import React, { FC } from "react";
import { ExternalLink } from "../ExternalLink/ExternalLink";
import { SectionHeading } from "../SectionHeading/SectionHeading";
import { Property } from "../Property/Property";
import { VerticalDivider } from "../Divider/Divider";
import { SectionBlock } from "../SectionBlock/SectionBlock";
import "./Contact.css";
import { Member } from "../../api/types";
import { MemberStatus } from "../MemberStatus/MemberStatus";

export interface ContactProps {
  member: Member|null;
  userName: string|null;
  userEmail: string|null;
  settings: { domain?: string; };
}

export const Contact: FC<ContactProps> = ({ member, settings, userName, userEmail }: ContactProps) => {
  return (
    <>
      <SectionBlock justify={"space-between"} align={"center"}>
        <SectionHeading text="Contact" />
        {member && <ExternalLink href={`https://${settings.domain}.admin.mailchimp.com/lists/members/view?id=${member.webId}&use_segment=Y`} />}
      </SectionBlock>
      <SectionBlock>
        <Property title="Email">
          {member ? member.email : userEmail}
        </Property>
      </SectionBlock>
      <SectionBlock align="stretch">
        <Property title="Full Name">
          {member ? member.fullName : userName}
        </Property>
      </SectionBlock>
      {member && (
        <SectionBlock align="stretch">
          <Property title="Marketing Status" width="50%">
            <div className="status-pill-container">
              <MemberStatus status={member.status} />
            </div>
          </Property>
          <VerticalDivider />
          <Property title="Rating">
            {member.rating}/5
          </Property>
        </SectionBlock>
      )}
    </>
  );
};
