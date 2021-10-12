import createValidator, {createDetailedValidator, registerType} from 'typecheck.macro';

export interface TeamReference { team: string; }
export interface RepoReference { repo: string; }
export interface UserReference { username: string; }

export type Renderer = 'terminal' | 'web';
export type Backbone = 'ws' | 'eventemitter';

export interface UserSource {
    username: '__self__' | string;
    ignore: Array<RepoReference | UserReference>;
}
export interface OrganizationSource {
    organization: string;
    include: Array<TeamReference | RepoReference>
    ignore: Array<RepoReference | UserReference>;
}

export interface GlobalConfig {
    renderer: Renderer;
    backbone: Backbone;
    daemon: boolean;
    ignore: Array<RepoReference | UserReference>;
}

export interface Config {
    sources: Array<UserSource | OrganizationSource>;
    config?: GlobalConfig;
}

registerType('Config')
export const configValidator = createDetailedValidator<Config>();