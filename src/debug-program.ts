import {Config} from "./config-types";
import {load_and_validate} from "./config-loader";
import * as GH from "./gh-utils";
import {Query} from "./github-graphql-query-builder";
import * as GithubQueryBuilder from "./github-graphql-query-builder";
import {PrioritizedPullRequest, PullRequest, UpdateState} from "./domain";
import * as Fetcher from "./github-graphql-fetcher";
import {create_pull_request_blocking_map, pull_request_classifier_factory} from "./data-utils";

export async function debugProgram() {
    console.log('Started debug program....')
    console.log('-------------------------')
    console.log();

    const config: Config = load_and_validate();
    const whoami = await GH.whoami();
    const token = await GH.findAuthToken();

    const queries: Query[] = GithubQueryBuilder.build_query(whoami.name, config);
    const responses: Array<PullRequest[]> = await Promise.all(queries.map((query) =>
        Fetcher.fetch(token.token, query)
    ));

    const pullRequests: PullRequest[] = responses.reduce((a, b) => a.concat(b), []);

    const pr_classifier = pull_request_classifier_factory(whoami.name)
    const blocking_map = create_pull_request_blocking_map(pullRequests);
    const prs_prioritized: PrioritizedPullRequest[] = pullRequests
        .map((pr) => ({...pr, priority: pr_classifier(pr, blocking_map), update_state: UpdateState.NO_CHANGE }))
        .sort((a, b) => b.priority - a.priority);

    console.log('prs', prs_prioritized);
    console.log('prs', prs_prioritized.length);
}