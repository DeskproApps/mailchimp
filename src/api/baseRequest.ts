import { IDeskproClient, proxyFetch } from '@deskpro/app-sdk';
import { IS_USING_OAUTH, OAUTH2_ACCESS_TOKEN_PATH } from '../constants';

interface BaseRequest {
    client: IDeskproClient;
    endpoint: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    queryParameters?: URLSearchParams;
    headers?: Record<string, string>;
    data?: FormData | Record<string, unknown>;
};

type BaseRequestType = <T>(parameters: BaseRequest) => Promise<T>;

export const baseRequest: BaseRequestType = async ({
    client,
    endpoint,
    method = 'GET',
    queryParameters = new URLSearchParams(),
    headers: customHeaders = {},
    data
}) => {
    const fetch = await proxyFetch(client);
    const isUsingOAuth = (await client.getUserState<boolean>(IS_USING_OAUTH))[0].data;

    // URL
    
    const baseURL = isUsingOAuth ? 'https://__domain__.api.mailchimp.com/3.0' : 'https://x:__api_key__@__domain__.api.mailchimp.com/3.0';
    let requestURL = `${baseURL}${endpoint}`;

    if (queryParameters.size > 0) requestURL += `?${queryParameters.toString()}`;

    // headers

    const headers: Record<string, string> = {
        ...customHeaders
    };

    if (isUsingOAuth) {
        headers['authorization'] = `Bearer [user[${OAUTH2_ACCESS_TOKEN_PATH}]]`;
    };

    // body

    let body = undefined;

    if (data instanceof FormData) {
        body = data;
    } else if (data) {
        headers['content-type'] = 'application/json';
        headers['accept'] = 'application/json';
        body = JSON.stringify(data);
    };

    // response

    const response = await fetch(requestURL, { method, headers, body });

    if (response.status < 200 || response.status >= 400) {
        throw new Error('Mailchimp API Error');
    };

    return await response.json();
};