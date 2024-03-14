import React, {ChangeEvent, FC, useState} from "react";
import {SetNextPage, Settings} from "./types";
import { Button, Stack, Checkbox, Label } from "@deskpro/deskpro-ui";
import {
    Section,
    useInitialisedDeskproAppClient,
    useDeskproAppClient, useDeskproAppTheme
} from "@deskpro/app-sdk";
import {SectionBlock} from "../components/SectionBlock/SectionBlock";
import {SectionHeading} from "../components/SectionHeading/SectionHeading";
import {ExternalLink} from "../components/ExternalLink/ExternalLink";
import {Property} from "../components/Property/Property";
import {MemberStatus} from "../components/MemberStatus/MemberStatus";
import {HorizontalDivider, VerticalDivider} from "../components/Divider/Divider";
import {Audience, Member} from "../api/types";
import {setMarketingPermissions} from "../api/api";
import {UserName} from "../types";

interface ViewProps {
    member: Member;
    audience: Audience;
    setNextPage: SetNextPage;
    userEmail: string;
    userName: UserName;
    settings: Settings;
    isArchived?: boolean;
}

export const View: FC<ViewProps> = ({ audience, userEmail, userName, settings, member, isArchived, setNextPage }: ViewProps) => {
    const { client } = useDeskproAppClient();
    const { theme } = useDeskproAppTheme();

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState<boolean>(false);
    const [gdprStates, setGdprStates] = useState<Record<string, boolean>>(
        (member?.marketingPermissions ?? []).reduce((all, p) => ({...all, [p.id]: p.enabled}), {})
    );

    useInitialisedDeskproAppClient((client) => {
        if (member) {
            client.registerElement("view_menu", { type: "menu", items: [{
                    title: "Archive Mailchimp User",
                    payload: {
                        action: "archive_mailchimp_user",
                        audience: audience,
                        member: member,
                    },
                }] });
        } else {
            client.deregisterElement("view_menu");
        }

        client.setTitle(audience.name);
    }, [audience]);

    const save = () => {
        if (!client || !member || !audience) {
            return;
        }

        setIsSubmitting(true);

        setMarketingPermissions(client, audience.id, member.id, gdprStates)
            .then(() => setIsSuccess(true))
            .finally(() => setIsSubmitting(false))
        ;
    };

    return (
        <div className="page-main">
            {isSuccess && (
                <Section>
                    <div className="message-success" style={{ backgroundColor: theme.colors.green100 }}>
                        Marketing preferences have been successfully saved
                    </div>
                </Section>
            )}
            {isArchived && (
                <Section>
                    <div className="message-success" style={{ backgroundColor: theme.colors.green100 }}>
                        Member has been successfully archived
                    </div>
                </Section>
            )}
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
                        {member ? member.fullName : `${userName.first} ${userName.last}`}
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
            {(member?.marketingPermissions ?? []).length > 0 && audience.hasMarketingPreferences && (
                <>
                    <Section>
                        <Stack gap={8} vertical>
                            <SectionHeading text="GDPR Subscriptions" />
                            {(member.marketingPermissions ?? []).map((permission, idx: number) => (
                                <Stack gap={8} align="center" key={idx}>
                                    <Checkbox
                                        checked={gdprStates[permission.id]}
                                        value={1}
                                        id={permission.id}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setGdprStates({
                                            ...gdprStates,
                                            [permission.id]: e.target.checked,
                                        })}
                                        size={14}
                                    />
                                    <Label htmlFor={permission.id} className="gdpr-label">
                                        {permission.text}
                                    </Label>
                                </Stack>
                            ))}
                        </Stack>
                    </Section>
                    <HorizontalDivider />
                </>
            )}
            <Section>
                <Stack justify="space-between">
                    <Button
                        text="Save"
                        onClick={save}
                        disabled={(member?.marketingPermissions ?? []).length === 0 && audience.hasMarketingPreferences}
                        loading={isSubmitting}
                    />
                    <Button text="Cancel" intent="secondary" onClick={() => setNextPage("home")} />
                </Stack>
            </Section>
        </div>
    );
};
