import {Config} from "./config-types";
import {load_and_validate} from "./config-loader";
import * as GH from "./gh-utils";
import {Query} from "./github-graphql-query-builder";
import * as GithubQueryBuilder from "./github-graphql-query-builder";
import {PrioritizedPullRequest, Repository} from "./domain";
import * as Fetcher from "./github-graphql-fetcher";
import {pull_request_classifier_factory, uniqueRepos} from "./data-utils";

export async function debugProgram() {
    console.log('Started debug program....')
    console.log('-------------------------')
    console.log();

    const config: Config = load_and_validate();
    const whoami = await GH.whoami();
    const token = await GH.findAuthToken();

    const queries: Query[] = GithubQueryBuilder.build_query(whoami.name, config);
    const responses: Array<Repository[]> = await Promise.all(queries.map((query) =>
        Fetcher.fetch(token.token, query)
    ));

    const all_repos: Repository[] = responses.reduce((a, b) => a.concat(b), []);
    const repos: Repository[] = uniqueRepos(all_repos);

    const pr_classifier = pull_request_classifier_factory(whoami.name)
    const prs_prioritized: PrioritizedPullRequest[] = repos
        .flatMap((repo) => repo.pullRequests)
        .map((pr) => ({...pr, priority: pr_classifier(pr)}))
        .sort((a, b) => b.priority - a.priority);

    console.log('prs', prs_prioritized);
    console.log('prs', prs_prioritized.length);
}