import React, {ReactNode, useState} from "react";
import {Page, Settings} from "./types";
import {match} from "ts-pattern";
import {Home} from "./Home";
import {View} from "./View";
import {Context, useDeskproAppEvents} from "@deskpro/app-sdk";
import {UserContextData} from "../types";

export const Main = () => {
  const [page, setPage] = useState<Page>("home");
  const [pageProps, setPageProps] = useState<any>(undefined);

  const [userEmail, setUserEmail] = useState<string|null>(null);
  const [userName, setUserName] = useState<string|null>(null);
  const [settings, setSettings] = useState<Settings>({});

  useDeskproAppEvents({
    onReady: (c: Context) => {
      const data = c.data as UserContextData;

      if (data?.user?.primaryEmail) {
        setUserEmail(data.user.primaryEmail);
      }

      if (data?.user?.name) {
        setUserName(data.user.name);
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
        setUserName(data.user.name);
      }

      if (c?.settings) {
        setSettings(c.settings);
      }
    },
  });

  const setPageNext = (page: Page, props: any) => {
    setPageProps(props);
    setPage(page);
  };

  return match<Page, ReactNode>(page)
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
  ;
};
