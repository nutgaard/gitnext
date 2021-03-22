import * as GraphQLFetch from './graphql-fetch';
import {Query} from "./github-graphql-query-builder";
import {RepoReference, UserReference} from "./config-types";
import {PullRequest} from "./domain";
import * as Fixtures from './fixtures/fixtures';
import { useFixtures } from './program-config';

interface Paginator<T> {
    shouldPaginate: boolean;
    extractPageInfo(data: T): { hasNextPage: false, endCursor: string | undefined };
}
function createPaginator<T>(paginateInfo: string | undefined): Paginator<T> {
    if (paginateInfo === undefined) {
        return {
            shouldPaginate: false,
            extractPageInfo: () => ({ hasNextPage: false, endCursor: undefined })
        };
    }
    const splits = paginateInfo.split('.');
    const extractPageInfo = (data: T) => splits.reduce((current: any, split: string) => current[split], data);
    return {
        shouldPaginate: true,
        extractPageInfo: extractPageInfo as Paginator<any>["extractPageInfo"]
    }
}

function isRepoReference(reference: RepoReference | UserReference): reference is RepoReference {
    return reference.hasOwnProperty('repo');
}
function build_filter(ignore_config: Array<RepoReference | UserReference>): (repository: PullRequest) => boolean {
    const pass = () => true;
    const ignore_checks = ignore_config
        .map((reference) => {
            if (isRepoReference(reference)) {
                return (owner: string, reponame: string) => `${owner}/${reponame}` !== reference.repo;
            } else {
                return pass;
            }
        })
    return (repo) => {
        return ignore_checks.every((check) => check(repo.baseRepository.owner, repo.baseRepository.name));
    }
}

export async function fetch(token: string, query_config: Query): Promise<PullRequest[]> {
    const { query, paginateInfo, postProcess, config } = query_config;
    let data = [];
    if (useFixtures) {
        if (config.hasOwnProperty('username')) {
            data = await Fixtures.user_data();
        } else {
            data = await Fixtures.org_data();
        }
    } else {
        const paginator = createPaginator(paginateInfo);
        let variables = {};
        do {
            const result = await GraphQLFetch.query(token, query, variables);
            data.push(result);
            const pageInfo = paginator.extractPageInfo(result);
            if (!pageInfo.hasNextPage) {
                break;
            }
            variables = { endCursor: pageInfo.endCursor };
        } while (true);
    }

    return postProcess(query_config.config, data)
        .filter(build_filter(config.ignore));
}