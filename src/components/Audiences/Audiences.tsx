import React, { ChangeEvent, FC, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import {
  Button,
  Checkbox,
  Spinner,
  Stack, Tooltip,
  useDeskproAppClient
} from "@deskpro/app-sdk";
import { SectionHeading } from "../SectionHeading/SectionHeading";
import { ExternalLink } from "../ExternalLink/ExternalLink";
import { SectionBlock } from "../SectionBlock/SectionBlock";
import "./Audiences.css";
import {
  getAudiences,
  subscribeNewAudienceMember,
  updateAudienceSubscription
} from "../../api/api";
import { AudienceList, Member } from "../../api/types";
import { ErrorBlock } from "../ErrorBlock/ErrorBlock";

export interface AudiencesProps {
  member: Member|null;
  userName: string|null;
  userEmail: string|null;
  reloadMember: () => void;
  settings: { domain?: string; };
}

export const Audiences: FC<AudiencesProps> = ({ member, settings, userName, userEmail, reloadMember }: AudiencesProps) => {
  const [audienceStatuses, setAudienceStatuses] = useState<Record<string, {webId: number, label: string, hasMarketingPreferences: boolean, checked: boolean, loading: boolean}>|undefined>(undefined);
  const [unsubscribeAllLoading, setUnsubscribeAllLoading] = useState<boolean>(false);
  const [isListLoaded, setIsListLoaded] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { client } = useDeskproAppClient();

  if (!userName) {
    return (<></>);
  }

  const loadList = (cb?: () => void) => {
    if (!client) {
      return;
    }

    getAudiences(client).then((audiences: AudienceList) => {
      setAudienceStatuses(audiences.reduce((all, audience) => ({
        ...all,
        [audience.id]: {
          label: audience.name,
          webId: audience.webId,
          hasMarketingPreferences: audience.hasMarketingPreferences,
          checked: false,
          loading: false,
          exists: false,
        },
      }), {}));

      if (member) {
        getAudiences(client, member.email).then((subscribed: AudienceList) => {
          setAudienceStatuses(audiences.reduce((all, audience) => ({
            ...all,
            [audience.id]: {
              label: audience.name,
              webId: audience.webId,
              hasMarketingPreferences: audience.hasMarketingPreferences,
              checked: !! subscribed.filter((s) => s.id === audience.id).length,
              loading: false,
              exists: true,
            },
          }), {}));
          setIsListLoaded(true);
          cb && cb();
        });
      } else {
        setIsListLoaded(true);
      }
    });
  };

  useEffect(() => {
    if (!client || !isListLoaded || !audienceStatuses) {
      return;
    }

    client.setBadgeCount(Object.values(audienceStatuses).filter((a) => a.checked).length);
  }, [client, audienceStatuses, isListLoaded]);

  useEffect(() => {
    loadList();
  }, [client, member]);

  if (audienceStatuses === undefined) {
    return (
      <SectionBlock justify="center">
        <Spinner size="small" />
      </SectionBlock>
    );
  }

  const handleAudienceToggle = (id: string, checked: boolean) => {
    if (!client) {
      return;
    }

    setAudienceStatuses({
      ...audienceStatuses,
      [id]: {
        ...audienceStatuses[id],
        loading: true,
      }
    });

    setIsListLoaded(false);

    if (member) {
      updateAudienceSubscription(client, id, member.email, checked ? "subscribed" : "unsubscribed")
        .then(() => loadList())
      ;
    } else if (userName && userEmail) {
      subscribeNewAudienceMember(client, id, userEmail, userName)
        .then((r) => {
          if (Array.isArray(r)) {
            setErrors(r);
            setAudienceStatuses({
              ...audienceStatuses,
              [id]: {
                ...audienceStatuses[id],
                loading: false,
              }
            });
            setIsListLoaded(true);
            return;
          }

          if (r) {
            reloadMember();
            return;
          }
        })
      ;
    }
  };

  const handleUnsubscribeAll = () => {
    if (!client || !member) {
      return;
    }

    setUnsubscribeAllLoading(true);
    setIsListLoaded(false);

    const updates = Object.keys(audienceStatuses).map((id: string) => {
      return updateAudienceSubscription(client, id, member.email, "unsubscribed");
    });

    Promise.all(updates).then(() => {
      loadList(() => setUnsubscribeAllLoading(false));
    });
  };

  return (
    <>
      <SectionBlock justify={"space-between"} align={"center"}>
        <SectionHeading text={`Audiences (${Object.values(audienceStatuses).filter((a) => a.checked).length})`} />
        <ExternalLink href={`https://${settings.domain}.admin.mailchimp.com/lists/`} />
      </SectionBlock>
      {errors.length > 0 && (
        <ErrorBlock errors={errors} />
      )}
      <>
        {Object.keys(audienceStatuses).map((id, idx) => (
          <Stack gap={8} align="center" key={idx} className="audience-checkbox-row">
            <Stack align="center" gap={8}>
              {audienceStatuses[id].loading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <Tooltip content={
                  <div style={{ padding: "2px 4px", maxWidth: "200px" }}>
                    {audienceStatuses[id].checked ? (
                      "Unsubscribe from audience"
                    ) : (
                      audienceStatuses[id].hasMarketingPreferences ? "Subscribe to audience & opt-in to all marketing preferences" : "Subscribe to audience"
                    )}
                  </div>
                } placement="bottom" styleType="extraDark">
                  <span>
                    <Checkbox
                      checked={audienceStatuses[id].checked}
                      value={id}
                      id={id}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleAudienceToggle(id, e.target.checked)}
                      size={14}
                      disabled={!isListLoaded}
                    />
                  </span>
                </Tooltip>
              )}
              <label htmlFor={id} className="audience-label">
                {audienceStatuses[id].label}
              </label>
            </Stack>
            <ExternalLink href={`https://${settings.domain}.admin.mailchimp.com/lists/members?id=${audienceStatuses[id].webId}#p:1-s:25-sa:last_update_time-so:false`} />
          </Stack>
        ))}
      </>
      {(Object.values(audienceStatuses).filter((a) => a.checked).length > 0 && member) && (
        <div className="audience-controls">
          <Button text={unsubscribeAllLoading ? "Loading" : "Unsubscribe All"}
                  intent="secondary"
                  disabled={unsubscribeAllLoading}
                  onClick={() => handleUnsubscribeAll()}
          />
        </div>
      )}
    </>
  );
};
