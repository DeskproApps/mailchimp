import { useCallback, useRef, useState } from 'react';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { Title, useDeskproLatestAppContext, useInitialisedDeskproAppClient } from '@deskpro/app-sdk';
import { AnchorButton } from '@deskpro/deskpro-ui';
import { SetNextPage, Settings } from './types';
import { GLOBAL_CLIENT_ID } from '../constants';
import Container from '../components/Container/Container';
import { getAccessToken } from '../services/getAccessToken';
import setAccessToken from '../services/setAccessToken';

interface LogIn {
    setNextPage: SetNextPage;
};

export function LogIn({ setNextPage }: LogIn) {
    const { context } = useDeskproLatestAppContext<unknown, Settings>();
    const navigate = useNavigate();
    const callbackURLRef = useRef('');
    const [authorisationURL, setAuthorisationURL] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useInitialisedDeskproAppClient(async client => {
        if (context?.settings.use_deskpro_saas === undefined) {
            return;
        };

        if (context.settings.use_api_key === true) {
            return;
        };

        const clientID = context.settings.client_id;
        const mode = context?.settings.use_deskpro_saas ? 'global' : 'local';

        if (mode === 'local' && typeof clientID !== 'string') {
            return;
        };

        const oauth2 = mode === 'global' ? await client.startOauth2Global(GLOBAL_CLIENT_ID) : await client.startOauth2Local(
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

        setAuthorisationURL(oauth2.authorizationUrl);

        try {
            const pollResult = await oauth2.poll();

            await setAccessToken({ client, token: pollResult.data.access_token });
            setNextPage('home');
        } catch (error) {

        } finally {
            setIsLoading(false);
        };
    }, [context, navigate]);

    const onLogIn = useCallback(() => {
        setIsLoading(true);
        window.open(authorisationURL, '_blank');
      }, [setIsLoading, authorisationURL]);

    return (
        <Container>
            <Title title='Log into Mailchimp' />
            <AnchorButton
                text='Log In'
                target='_blank'
                href={authorisationURL ?? '#'}
                loading={!authorisationURL || isLoading}
                disabled={!authorisationURL || isLoading}
                onClick={onLogIn}
            />
        </Container>
    );
};