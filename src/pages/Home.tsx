import React, {FC, useEffect, useState} from "react";
import {SetNextPage, Settings} from "./types";
import {Member} from "../api/types";
import {LoadingSpinner, Section, useDeskproAppClient, useInitialisedDeskproAppClient} from "@deskpro/app-sdk";
import {getMemberLists} from "../api/api";
import {Contact} from "../components/Contact/Contact";
import {HorizontalDivider} from "../components/Divider/Divider";
import {Audiences} from "../components/Audiences/Audiences";
import {Campaigns} from "../components/Campaigns/Campaigns";
import {UserName} from "../types";

interface HomeProps {
    userEmail: string;
    userName: UserName;
    settings: Settings;
    setNextPage: SetNextPage;
}

export const Home: FC<HomeProps> = ({ setNextPage, userEmail, userName, settings }: HomeProps) => {
    const [memberLists, setMemberLists] = useState<Member[]|null|undefined>(undefined);

    const { client } = useDeskproAppClient();

    useInitialisedDeskproAppClient((client) => {
        client.setTitle("Mailchimp");
        client.deregisterElement("view_menu");
    }, []);

    const loadMember = async () => {
        if (client && userEmail) {
            return getMemberLists(client, userEmail).then(setMemberLists);
        }
    };

    useEffect(() => {
        loadMember();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <Section>
                <Campaigns members={memberLists ?? []} settings={settings} />
            </Section>
        </div>
    );
};
