import { IDeskproClient } from '@deskpro/app-sdk';
import { OAUTH2_ACCESS_TOKEN_PATH } from '../constants';

interface SetAccessToken {
    client: IDeskproClient;
    token: string;
};

export function setAccessToken({ client, token }: SetAccessToken) {
    return client.setUserState(OAUTH2_ACCESS_TOKEN_PATH, token, {backend: true});
};