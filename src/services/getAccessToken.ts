import { IDeskproClient, proxyFetch } from '@deskpro/app-sdk';

interface GetAccessToken {
    client: IDeskproClient;
    code: string;
    redirectURI: string;
};

export async function getAccessToken({ client, code, redirectURI }: GetAccessToken) {
    const fetch = await proxyFetch(client);

    const parameters = new URLSearchParams({
        client_id: '__client_id__',
        client_secret: '__client_secret__',
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectURI
    }).toString();

    try {
        const response = await fetch('https://login.mailchimp.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: parameters
        });

        if (!response.ok) {
            throw new Error(await response.json());
        };

        const data = await response.json();

        return {access_token: data.access_token};
    } catch (error) {
        throw new Error('error getting access token');
    };
};