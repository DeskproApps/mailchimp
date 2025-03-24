import { AnchorButton, H3 } from '@deskpro/deskpro-ui';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { ErrorBlock } from '../components/ErrorBlock/ErrorBlock';
import { getAccessToken } from '../api/getAccessToken';
import { GLOBAL_CLIENT_ID } from '../constants';
import { IOAuth2, useDeskproLatestAppContext, useInitialisedDeskproAppClient } from '@deskpro/app-sdk';
import { setAccessToken } from '../api/setAccessToken';
import { SetNextPage, Settings } from './types';
import { useCallback, useRef, useState } from 'react';
import Container from '../components/Container/Container';

interface LogIn {
    setNextPage: SetNextPage;
};

export function LogIn({ setNextPage }: LogIn) {
    const { context } = useDeskproLatestAppContext<unknown, Settings>();
    const navigate = useNavigate();
    const callbackURLRef = useRef('');
    const [authorisationURL, setAuthorisationURL] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false)
    const [oAuth2Context, setOAuth2Context] = useState<IOAuth2 | null>(null)
    const [error, setError] = useState('');
    const isUsingOAuth = context?.settings.use_api_key === false || context?.settings.use_advanced_connect === false


    useInitialisedDeskproAppClient(async client => {
        if (!context?.settings) {
            return;
        };

        if (!isUsingOAuth) {
            return;
        };

        const clientID = context.settings.client_id;
        const mode = context?.settings.use_advanced_connect ? 'local' : 'global';

        if (mode === 'local' && typeof clientID !== 'string') {
            return;
        };

        const oauth2Response = mode === 'global' ? await client.startOauth2Global(GLOBAL_CLIENT_ID) : await client.startOauth2Local(
            ({ callbackUrl, state }) => {
                callbackURLRef.current = callbackUrl;

                if (!clientID) {
                    return '';
                };

                return `https://login.mailchimp.com/oauth2/authorize?${createSearchParams([
                    ['client_id', clientID],
                    ['state', state],
                    ['response_type', 'code'],
                    ['redirect_uri', callbackUrl]
                ])}`;
            },
            /code=(?<code>[^&]+)/,
            async code => {
                const data = await getAccessToken({
                    client,
                    code,
                    redirectURI: callbackURLRef.current
                });

                return { data };
            }
        );

        setAuthorisationURL(oauth2Response.authorizationUrl);
        setOAuth2Context(oauth2Response)

    }, [context, navigate]);

    useInitialisedDeskproAppClient((client) => {
        if (!oAuth2Context) {
            return
        }

        const startPolling = async () => {
            try {
                const pollResult = await oAuth2Context.poll();

                await setAccessToken({ client, token: pollResult.data.access_token });
                setNextPage('home');
            } catch (error) {
                setError(error instanceof Error ? error.message : 'error logging in');
            } finally {
                setIsLoading(false)
                setIsPolling(false)
            }
        }

        if (isPolling) {
            void startPolling()
        }
    }, [isPolling, oAuth2Context, navigate])

    const onLogIn = useCallback(() => {
        setIsLoading(true);
        setIsPolling(true);
        window.open(authorisationURL, '_blank');
    }, [setIsLoading, authorisationURL]);

    return (
        <Container>
            <H3>Log into Mailchimp</H3>
            <AnchorButton
                text='Log In'
                target='_blank'
                href={authorisationURL ?? '#'}
                loading={!authorisationURL || isLoading}
                disabled={!authorisationURL || isLoading}
                onClick={onLogIn}
            />
            {error && <ErrorBlock errors={[error]} />}
        </Container>
    );
};