import fs from 'fs';
import {ConfigV1, OrganizationSource, RepoReference, TeamReference, UserSource} from "./config/config-types";
import {exit_error} from "./program-utils";
import * as GithubGraphQLHandler from './github-graphql-query-response-handler';
import {PullRequest} from "./domain";

const team_fragment = fs.readFileSync(__dirname + '/graphql-queries/team-fragment.graphql', 'utf8');
const repo_fragment = fs.readFileSync(__dirname + '/graphql-queries/repo-fragment.graphql', 'utf8');
const pullrequest_fragment = fs.readFileSync(__dirname + '/graphql-queries/pullrequest-fragment.graphql', 'utf8');
const user_repo_query = fs.readFileSync(__dirname + '/graphql-queries/get-user-repos.graphql', 'utf8');
const org_repo_subquery = fs.readFileSync(__dirname + '/graphql-queries/org-repo-subquery.graphql', 'utf8');
const team_subquery = fs.readFileSync(__dirname + '/graphql-queries/team-subquery.graphql', 'utf8');

function replaceVars(base: string, values: { [key: string]: string; }): string {
    const vars = Object.keys(values).join('|');
    const pattern = new RegExp(`\\{\\{\\s?(${vars})\\s?\\}\\}`, 'g');
    return base.replace(pattern, (_, match) => values[match]);
}

function keyOf(key: string): string {
    return key.replace(/\W/g, '')
}

export interface Query {
    query: string;
    paginateInfo?: string;
    postProcess: (config: any, data: any) => PullRequest[];
    config: any;
}
interface ConfigHandler {
    predicate(value: UserSource | OrganizationSource): boolean;
    build(user: string, value: any): Query;
}
const config_handlers: Array<ConfigHandler> = [
    {
        predicate(value: UserSource | OrganizationSource) {
            return value.hasOwnProperty('username');
        },
        build: build_user_query
    },
    {
        predicate(value: UserSource | OrganizationSource) {
            return value.hasOwnProperty('organization');
        },
        build: build_org_query
    },
];

export function build_user_query(user: string, config: UserSource): Query {
    const buffer = [];
    const requestedUser = config.username === '__self__' ? user : config.username;
    buffer.push(replaceVars(user_repo_query, {USER: requestedUser}));
    buffer.push(repo_fragment);
    buffer.push(pullrequest_fragment);
    return {
        query: buffer.join('\n'),
        paginateInfo: 'data.user.repositories.pageInfo',
        postProcess: GithubGraphQLHandler.userQuery,
        config
    };
}

export function build_org_query(user: string, config: OrganizationSource): Query {
    const buffer = [];
    const organization = config.organization;
    let has_team_subquery = false;
    let has_repo_subquery = false;
    buffer.push('query {')
    config.include
        .filter((include) => include.hasOwnProperty('team'))
        .forEach((reference) => {
            has_team_subquery = true;
            has_repo_subquery = true;
            const teamReference = reference as TeamReference;
            const key_name = `team_${keyOf(teamReference.team)}`;
            const replacements = {
                KEY: key_name,
                ORG: organization,
                TEAM: teamReference.team
            };

            const subquery = replaceVars(team_subquery, replacements);
            buffer.push(subquery);
        });
    config.include
        .filter((include) => include.hasOwnProperty('repo'))
        .forEach((reference) => {
            has_repo_subquery = true;
            const repoReference = reference as RepoReference;
            const key_name = `repo_${keyOf(repoReference.repo)}`;
            const replacements = {
                KEY: key_name,
                ORG: organization,
                REPO: repoReference.repo
            };

            const subquery = replaceVars(org_repo_subquery, replacements);
            buffer.push(subquery);

        });

    buffer.push('}');
    if (has_team_subquery) {
        buffer.push(team_fragment);
    }
    if (has_repo_subquery) {
        buffer.push(repo_fragment);
        buffer.push(pullrequest_fragment);
    }

    return {
        query: buffer.join('\n'),
        postProcess: GithubGraphQLHandler.orgQuery,
        config
    };
}



export function build_query(user: string, config: ConfigV1): Query[] {
    return config.sources.map((config_element) => {
        const handler = config_handlers.find((handler) => handler.predicate(config_element));
        if (handler) {
            return handler.build(user, config_element);
        }
        exit_error('Found unrecognized config element: ' + JSON.stringify(config_element));
        throw new Error("just here to inform TS");
    });
}