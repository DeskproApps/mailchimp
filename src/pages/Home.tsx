import React, {FC, useEffect, useState} from "react";
import {SetNextPage, Settings} from "./types";
import {Member} from "../api/types";
import {LoadingSpinner, Section, useDeskproAppClient, useInitialisedDeskproAppClient} from "@deskpro/app-sdk";
import {getMemberLists} from "../api/api";
import {Contact} from "../components/Contact/Contact";
import {HorizontalDivider} from "../components/Divider/Divider";
import {Audiences} from "../components/Audiences/Audiences";
import {Campaigns} from "../components/Campaigns/Campaigns";

interface HomeProps {
    userEmail: string;
    userName: string;
    settings: Settings;
    setNextPage: SetNextPage;
}

export const Home: FC<HomeProps> = ({ setNextPage, userEmail, userName, settings }: HomeProps) => {
    const [memberLists, setMemberLists] = useState<Member[]|null|undefined>(undefined);

    const { client } = useDeskproAppClient();

    useInitialisedDeskproAppClient((client) => {
        client.setTitle("Mailchimp");
    }, []);

    const loadMember = async () => {
        if (client && userEmail) {
            return getMemberLists(client, userEmail).then(setMemberLists);
        }
    };

    useEffect(() => {
        loadMember();
    }, [userEmail, client]);

    if (!userName) {
        return (<></>);
    }

    if (!userEmail) {
        return (<></>);
    }

    if (memberLists === undefined) {
        return (<LoadingSpinner />);
    }

    return (
        <div className="page-main">
            <Section>
                <Contact userEmail={userEmail} />
            </Section>
            <HorizontalDivider />
            <Section>
                <Audiences
                    memberLists={memberLists}
                    settings={settings}
                    userName={userName}
                    userEmail={userEmail}
                    reloadMembers={loadMember}
                    setNextPage={setNextPage}
                />
            </Section>
            <HorizontalDivider />
            {/* todo: check that all members have the same ID, as some old/stale member IDs may be present in this list */}
            {(memberLists && memberLists[0]) && (
                <Section>
                    <Campaigns member={memberLists[0]} settings={settings} />
                </Section>
            )}
        </div>
    );
};
