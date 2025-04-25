import { FC, ReactNode, useState } from 'react';
import { Page, Settings } from "./types";
import { __, match } from "ts-pattern";
import { Home } from "./Home";
import { View } from "./View";
import { LogIn } from './LogIn';
import {
  Context,
  LoadingSpinner,
  useDeskproAppClient,
  useDeskproAppEvents,
  useDeskproLatestAppContext,
  useInitialisedDeskproAppClient
} from "@deskpro/app-sdk";
import { UserContextData, UserName } from "../types";
import { archiveMember, checkAuth } from "../api/api";
import { IS_USING_OAUTH } from '../constants';

export const Main: FC = () => {
  const { client } = useDeskproAppClient();
  const { context } = useDeskproLatestAppContext<unknown, Settings>();

  const [page, setPage] = useState<Page>('loading');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pageProps, setPageProps] = useState<any>(undefined);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<UserName | null>(null);
  const [settings, setSettings] = useState<Settings>({});

  useInitialisedDeskproAppClient((client) => {
    client.registerElement("refresh", { type: "refresh_button" });
  });

  useInitialisedDeskproAppClient(async client => {
    if (!context) {
      return;
    };

    const isUsingOAuth = context?.settings.use_api_key === false || context?.settings.use_advanced_connect === false

    await client.setUserState(IS_USING_OAUTH, isUsingOAuth);

    const isAuthenticated = await checkAuth(client);

    setPage(isAuthenticated ? 'home' : 'logIn');
  }, [context]);

  useDeskproAppEvents({
    onReady: (c: Context) => {
      const data = c.data as UserContextData;

      if (data?.user?.primaryEmail) {
        setUserEmail(data.user.primaryEmail);
      }

      if (data?.user?.name) {
        setUserName({ first: data.user.firstName, last: data.user.lastName });
      }

      if (c?.settings) {
        setSettings(c.settings);
      }
    },
    onChange: (c: Context) => {
      const data = c.data as UserContextData;

      if (data?.user?.primaryEmail) {
        setUserEmail(data.user.primaryEmail);
      }

      if (data?.user?.name) {
        setUserName({ first: data.user.firstName, last: data.user.lastName });
      }

      if (c?.settings) {
        setSettings(c.settings);
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onElementEvent: (id: string, type: string, payload: any) => match([id, type, payload])
      .with(["view_menu", __, { action: "archive_mailchimp_user", audience: __, member: __ }], () => {
        if (!client || !payload) {
          return;
        }

        archiveMember(client, payload.audience.id, payload.member.id)
          .then(() => setPageNext("view", {
            member: null,
            audience: payload.audience,
            isArchived: true,
          }))
          ;
      })
      .run()
    ,
  }, [client]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setPageNext = (page: Page, props: any) => {
    setPageProps(props);
    setPage(page);
  };

  return (
    <>
      {
        match<Page, ReactNode>(page)
          .with('loading', () => <LoadingSpinner />)
          .with('logIn', () => <LogIn
            setNextPage={setPageNext}
          />)
          .with("home", () => <Home
            setNextPage={setPageNext}
            userEmail={userEmail}
            userName={userName}
            settings={settings}
            {...pageProps}
          />)
          .with("view", () => <View
            setNextPage={setPageNext}
            userEmail={userEmail}
            userName={userName}
            settings={settings}
            {...pageProps}
          />)
          .exhaustive()
      }
    </>
  );
};
