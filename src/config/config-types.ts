export interface ConfigBeta {
    sources: Array<UserSource | OrganizationSource>
}
export interface ConfigV1 {
    version: '1.0';
    sources: Array<UserSource | OrganizationSource>;
    config?: GlobalConfig;
}
export interface GlobalConfig {
    renderer: Renderer;
    backbone: Backbone;
    daemon: boolean;
    ignore: Array<RepoReference | UserReference>;
}

export const Renderer = ['terminal', 'web'];
export const Backbone = ['ws', 'eventemitter'];
export const Daemon = ['true', 'false'];
export type Renderer = 'terminal' | 'web';
export type Backbone = 'ws' | 'eventemitter';

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