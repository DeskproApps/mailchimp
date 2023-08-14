import React, {ChangeEvent, FC, Fragment, useMemo, useState} from "react";
import { Audience, AudienceList, Member } from "../../api/types";
import "./Audiences.css";
import { SectionHeading } from "../SectionHeading/SectionHeading";
import { ExternalLink } from "../ExternalLink/ExternalLink";
import { SectionBlock } from "../SectionBlock/SectionBlock";
import {
    Button,
    Checkbox, HorizontalDivider,
    Spinner,
    Stack,
    Tooltip,
    useDeskproAppClient, useDeskproAppTheme,
    useInitialisedDeskproAppClient
} from "@deskpro/app-sdk";
import { getAudiences, subscribeNewAudienceMember, updateAudienceSubscription } from "../../api/api";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ErrorBlock } from "../ErrorBlock/ErrorBlock";
import {SetNextPage} from "../../pages/types";
import {UserName} from "../../types";

interface AudiencesProps {
    memberLists: Member[]|null;
    settings: { domain?: string; };
    userName: UserName;
    userEmail: string;
    reloadMembers: () => Promise<void>;
    setNextPage: SetNextPage;
}

export const Audiences: FC<AudiencesProps> = ({ memberLists, settings, userName, userEmail, reloadMembers, setNextPage }: AudiencesProps) => {
    const {client} = useDeskproAppClient();
    const {theme} = useDeskproAppTheme();
    const [audiences, setAudiences] = useState<AudienceList|undefined>(undefined);
    const [audienceLoading, setAudienceLoading] = useState<string|null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [unsubscribeAllLoading, setUnsubscribeAllLoading] = useState(false);

    useInitialisedDeskproAppClient((client) => {
        getAudiences(client).then(setAudiences);
    });

    const isSubscribed = (memberLists: Member[]|null, audience: Audience): boolean => {
        if (memberLists === null) {
            return false;
        }

        return !! memberLists
            .filter((m) => m.listId === audience.id && m.status === "subscribed")
            .length
        ;
    };

    const findMember = (memberLists: Member[]|null, audience: Audience): Member|null => {
        if (memberLists === null) {
            return null;
        }

        return memberLists.filter((m) => m.listId === audience.id)[0] ?? null;
    };

    const toggleSubscription = (subscribe: boolean, audience: Audience, member: Member|null) => {
        if (!client) {
            return;
        }

        setAudienceLoading(audience.id);

        const onComplete = () => {
            reloadMembers().finally(() => setAudienceLoading(null));
        };

        if (member) {
            // Existing audience member
            updateAudienceSubscription(client, audience.id, userEmail, subscribe ? "subscribed" : "unsubscribed")
                .then((result) => Array.isArray(result) && setErrors(result))
                .finally(() => onComplete())
            ;
        } else if (subscribe) {
            // New audience member
            subscribeNewAudienceMember(client, audience.id, userEmail, userName)
                .then((result) => Array.isArray(result) && setErrors(result))
                .finally(() => onComplete())
            ;
        }
    };

    const subscribedMembers = useMemo(
        () => (audiences ?? []).filter((audience) => isSubscribed(memberLists, audience)),
        [audiences, memberLists]
    );

    const numSubscribedMembers = useMemo(
        () => subscribedMembers.length,
        [subscribedMembers]
    );

    useInitialisedDeskproAppClient((client) => {
        client.setBadgeCount(numSubscribedMembers);
    }, [numSubscribedMembers]);

    const unsubscribeAll = () => {
        if (!client) {
            return;
        }

        setUnsubscribeAllLoading(true);

        const updates = subscribedMembers.map((audience) => {
            const member = findMember(memberLists, audience);

            if (!member) {
                return null;
            }

            return updateAudienceSubscription(client, audience.id, member.email, "unsubscribed");
        });

        Promise.all(updates.filter((update) => update !== null))
            .finally(() => reloadMembers())
            .finally(() => setUnsubscribeAllLoading(false))
        ;
    };

    if (audiences === undefined) {
        return (
            <SectionBlock justify="center">
                <Spinner size="small" />
            </SectionBlock>
        );
    }

    return (
        <>
            <SectionBlock justify={"space-between"} align={"center"}>
                <SectionHeading text={`Audiences (${numSubscribedMembers})`} />
                <ExternalLink href={`https://${settings.domain}.admin.mailchimp.com/lists/`} />
            </SectionBlock>
            {errors.length > 0 && (
                <ErrorBlock errors={errors} />
            )}
            {audiences.map((audience, idx: number) => {
                const subscribed = isSubscribed(memberLists, audience);
                const member = findMember(memberLists, audience);

                if (member?.status === "transactional") {
                    return (<Fragment key={idx} />);
                }

                return (
                    <div key={idx} className="audience-checkbox-row">
                        <Stack gap={8} align="center">
                            <Stack align="center" gap={8}>
                                {audienceLoading === audience.id ? <FontAwesomeIcon icon={faSpinner as unknown as {
                                    prefix: "fas";
                                    iconName: "mailchimp";
                                    }} spin /> : (
                                    <Tooltip content={
                                        <div style={{ padding: "2px 4px", maxWidth: "200px" }}>
                                            {subscribed ? (
                                                "Unsubscribe from audience"
                                            ) : (
                                                audience.hasMarketingPreferences
                                                    ? "Subscribe to audience & opt-in to all marketing preferences"
                                                    : "Subscribe to audience"
                                            )}
                                        </div>
                                    } placement="bottom" styleType="extraDark">
                                      <span>
                                        <Checkbox
                                            checked={subscribed}
                                            value={audience.id}
                                            id={audience.id}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => toggleSubscription(
                                                e.target.checked,
                                                audience,
                                                member
                                            )}
                                            size={14}
                                            disabled={audienceLoading !== null || unsubscribeAllLoading || ["cleaned", "pending"].includes(member?.status ?? "")}
                                        />
                                      </span>
                                    </Tooltip>
                                )}
                                <span
                                    onClick={() => setNextPage("view", {
                                        audience: audience,
                                        member: findMember(memberLists, audience),
                                        userName,
                                        userEmail,
                                        settings,
                                    })}
                                    style={{ color: theme.colors.cyan100 }}
                                    className="audience-label"
                                >
                                {audience.name}
                            </span>
                            </Stack>
                            <ExternalLink href={`https://${settings.domain}.admin.mailchimp.com/lists/members?id=${audience.webId}#p:1-s:25-sa:last_update_time-so:false`}/>
                        </Stack>
                        <HorizontalDivider />
                    </div>
                );
            })}
            {numSubscribedMembers > 0 && (
                <div className="audience-controls">
                    <Button text="Unsubscribe All"
                            intent="secondary"
                            disabled={unsubscribeAllLoading}
                            onClick={() => unsubscribeAll()}
                            loading={unsubscribeAllLoading}
                    />
                </div>
            )}
        </>
    );
};
