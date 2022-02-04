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
import { getMember } from "../api/api";
import { UserContextData } from "../types";

export const Main = () => {
  const [userEmail, setUserEmail] = useState<string|null>(null);
  const [userName, setUserName] = useState<string|null>(null);
  const [member, setMember] = useState<Member|null|undefined>(undefined);
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

  const loadMember = () => {
    if (client) {
      userEmail && getMember(client, userEmail).then(setMember);
    }
  };

  useEffect(() => {
    loadMember();
  }, [userEmail, client]);

  if (!userEmail) {
    return (<></>);
  }

  if (member === undefined) {
    return (<LoadingSpinner />);
  }

  return (
    <div className="page-main">
      <Section>
        <Contact member={member} userName={userName} userEmail={userEmail} settings={settings} />
      </Section>
      <HorizontalDivider />
      <Section>
        <Audiences member={member} userName={userName} userEmail={userEmail} settings={settings} reloadMember={loadMember} />
      </Section>
      <HorizontalDivider />
      {member && (
        <Section>
          <Campaigns member={member} settings={settings} />
        </Section>
      )}
    </div>
  );
};
