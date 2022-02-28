import React, { FC } from "react";
import {SetNextPage, Settings} from "./types";
import {Button, Stack, Section, useInitialisedDeskproAppClient} from "@deskpro/app-sdk";
import {SectionBlock} from "../components/SectionBlock/SectionBlock";
import {SectionHeading} from "../components/SectionHeading/SectionHeading";
import {ExternalLink} from "../components/ExternalLink/ExternalLink";
import {Property} from "../components/Property/Property";
import {MemberStatus} from "../components/MemberStatus/MemberStatus";
import {HorizontalDivider, VerticalDivider} from "../components/Divider/Divider";
import {Audience, Member} from "../api/types";

interface ViewProps {
    member: Member;
    audience: Audience;
    setNextPage: SetNextPage;
    userEmail: string;
    userName: string;
    settings: Settings;
}

export const View: FC<ViewProps> = ({ audience, userEmail, userName, settings, member, setNextPage }: ViewProps) => {
    useInitialisedDeskproAppClient((client) => {
        client.setTitle(audience.name);
    }, [audience]);

    return (
        <div className="page-main">
            <Section>
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
            </Section>
            <HorizontalDivider />
            <Section>
                <Stack justify="space-between">
                    <Button text="Save" onClick={() => {}} />
                    <Button text="Cancel" intent="secondary" onClick={() => setNextPage("home")} />
                </Stack>
            </Section>
        </div>
    );
};
