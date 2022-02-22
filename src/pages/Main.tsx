import React, { useEffect, useState } from "react";
import {
  Context,
  Section,
  LoadingSpinner,
  useDeskproAppClient,
  useDeskproAppEvents
} from "@deskpro/app-sdk";
import { Contact } from "../components/Contact/Contact";
import { HorizontalDivider } from "../components/Divider/Divider";
import { Audiences } from "../components/Audiences/Audiences";
import { Campaigns } from "../components/Campaigns/Campaigns";
import { Member } from "../api/types";
import { getMemberLists } from "../api/api";
import { UserContextData } from "../types";

export const Main = () => {
  const [userEmail, setUserEmail] = useState<string|null>(null);
  const [userName, setUserName] = useState<string|null>(null);
  const [memberLists, setMemberLists] = useState<Member[]|null|undefined>(undefined);
  const [settings, setSettings] = useState<{ domain?: string; }>({});

  const { client } = useDeskproAppClient();

  useDeskproAppEvents({
    onReady: (c: Context) => {
      const data = c.data as UserContextData;

      setUserEmail(data.user.primaryEmail);
      setUserName(data.user.name);
      setSettings(c.settings);
    },
    onChange: (c: Context) => {
      const data = c.data as UserContextData;

      setUserEmail(data.user.primaryEmail);
      setUserName(data.user.name);
      setSettings(c.settings);
    },
  });

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
        {/* todo: check that all members have the same ID, as some old/stale member IDs may be present in this list */}
        {(memberLists && memberLists[0]) ? (
            <Contact member={memberLists[0]} userName={userName} userEmail={userEmail} settings={settings} />
        ) : (
            <Contact member={null} userName={userName} userEmail={userEmail} settings={settings} />
        )}
      </Section>
      <HorizontalDivider />

      <Section>
        <Audiences memberLists={memberLists} settings={settings} userName={userName} userEmail={userEmail} reloadMembers={loadMember} />
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
