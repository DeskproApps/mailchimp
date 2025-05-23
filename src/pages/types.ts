export type Page = 
    | 'loading'
    | 'logIn'
    | 'home'
    | 'view'
    | 'error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SetNextPage = (page: Page, props?: any) => void;

export interface Settings {
    use_advanced_connect?: boolean;
    use_api_key?: boolean;
    client_id?: string;
    domain?: string;
};