export interface Config {
    sources: Array<UserSource | OrganizationSource>;
}
export interface BaseSource {
    ignore: Array<RepoReference | UserReference>;
}
export interface UserSource extends BaseSource {
    username: '__self__' | string;
}
export interface OrganizationSource extends BaseSource {
    organization: string;
    include: Array<TeamReference | RepoReference>
}

export interface TeamReference {
    team: string;
}
export interface RepoReference {
    repo: string;
}
export interface UserReference {
    username: string;
}