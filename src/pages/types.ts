export type Page = "home"|"view";

export type SetNextPage = (page: Page, props?: any) => void;

export interface Settings {
    domain?: string;
}
