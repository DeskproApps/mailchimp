export type Page = "home"|"view";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SetNextPage = (page: Page, props?: any) => void;

export interface Settings {
    domain?: string;
}
