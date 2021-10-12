import fs from 'fs';
import Yaml, {FAILSAFE_SCHEMA, YAMLException} from 'js-yaml';
import AsyncController from "./async-controller";
import {ServerSentEvents, ServerSentMessages} from "../../common/ws-message-formats";
import {PrioritizedPullRequest, PullRequest, Repository, UpdateState} from "../../domain";
import {getConfigLocation, writeDefaultConfig} from "../../config/config-loader";
import * as GH from "../../gh-utils";
import {ConfigV1, OrganizationSource, UserSource} from "../../config/config-types";
import {AuthToken, WhoAmI} from "../../gh-utils";
import * as GithubQueryBuilder from "../../github-graphql-query-builder";
import * as Fetcher from "../../github-graphql-fetcher";
import {pull_request_classifier_factory, uniqueBy} from "../../data-utils";
import validators, {Errors} from "../../config/config-validator";
import {isLeft, Validation} from "../../config/validation";

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export default class AsyncLoader {
    private isRunning: boolean = false;
    private wsControll: AsyncController<any, any>;
    private load_session_sync: ServerSentMessages[] = [];

    constructor(wsControll: AsyncController<any, any>) {
        this.wsControll = wsControll;
    }
    syncTo(sink: (message: ServerSentMessages) => void) {
        if (this.isRunning) {
            for (const message of this.load_session_sync) {
                sink(message);
            }
        }
    }

    async load() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.load_session_sync = [];
        for await (const message of loader()) {
            this.load_session_sync.push(message);
            this.wsControll.publishMessage(message);
        }
        this.isRunning = false;
    }
}

type Loader<RETURN = void> = AsyncGenerator<ServerSentMessages, RETURN, void>;
async function* loader(): Loader {
    try {
        const config: ConfigV1 = yield* loadConfig();
        await sleep(1000);
        const user: WhoAmI = yield* verifyUser();
        await sleep(1000);
        const token: AuthToken = yield* getToken();
        await sleep(1000);
        const previous_prs: PrioritizedPullRequest[] = yield* loadStoredData(config);
        await sleep(1000);
        const user_prs: PullRequest[] =  yield* loadUserData(user, token, config);
        await sleep(1000);
        const org_prs: PullRequest[] = yield* loadOrganizationData(user, token, config);
        await sleep(1000);
        const prioritized: PrioritizedPullRequest[] = yield* prioritizePullrequests(user, previous_prs, user_prs, org_prs);
        await sleep(1000);

        yield* storeData(prioritized);
    } catch (e: any) {
        if (e instanceof Error) {
            yield { type: ServerSentEvents.ERROR, error: e.message };
        } else {
            yield { type: ServerSentEvents.ERROR, error: `Unknown exception: ${e.toString()}` };
        }
    }
}

async function* loadConfig(): Loader<ConfigV1> {
    yield { type: ServerSentEvents.LOADING_CONFIG };
    const config_location = getConfigLocation();
    if (!fs.existsSync(config_location)) {
        writeDefaultConfig();
        yield { type: ServerSentEvents.CREATED_DEFAULT_CONFIG };
    }
    const config_source = fs.readFileSync(config_location, 'utf8');

    let yamlException: YAMLException | null = null;
    const raw_config: any = Yaml.load(config_source, {
        filename: config_location,
        onWarning(exception: YAMLException) {
            yamlException = exception;
        },
        schema: FAILSAFE_SCHEMA
    })
    if (yamlException !== null) {
        yield { type: ServerSentEvents.ERROR, error: (yamlException as YAMLException).message };
    } else {
        const version = raw_config?.version || 'beta';
        const config: Validation<Errors, ConfigV1> = validators[version](raw_config);
        if (isLeft(config)) {
            yield { type: ServerSentEvents.ERROR, error: config.left.join('\n') };
        } else {
            yield { type: ServerSentEvents.LOADED_CONFIG };
            return config.right
        }
    }
    throw new Error('Error loading config');
}

async function* verifyUser(): Loader<WhoAmI> {
    yield { type: ServerSentEvents.VERIFYING_USER };
    const user = await GH.whoami();
    yield { type: ServerSentEvents.VERIFIED_USER };
    return user;
}

async function* getToken(): Loader<AuthToken> {
    yield { type: ServerSentEvents.GETTING_TOKEN };
    const token = await GH.findAuthToken();
    yield { type: ServerSentEvents.GOT_TOKEN };
    return token;
}

async function* loadStoredData(config: ConfigV1): Loader<PrioritizedPullRequest[]> {
    yield { type: ServerSentEvents.LOADING_STORED_DATA };
    const data: PrioritizedPullRequest[] = [];
    yield { type: ServerSentEvents.LOADED_STORED_DATA, data };
    return data;
}

function isUserSource(source: UserSource | OrganizationSource): source is UserSource {
    return source.hasOwnProperty('username');
}
function isOrganizationSource(source: UserSource | OrganizationSource): source is OrganizationSource {
    return source.hasOwnProperty('organization');
}
async function* loadUserData(user: WhoAmI, token: AuthToken, config: ConfigV1): Loader<PullRequest[]> {
    yield { type: ServerSentEvents.LOADING_USER_DATA };

    const queries: Promise<PullRequest[]>[] = config.sources
        .filter(isUserSource)
        .map((source) => GithubQueryBuilder.build_user_query(user.name, source))
        .map((query) => Fetcher.fetch(token.token, query));
    const data: Array<PullRequest[]> = await Promise.all(queries);
    const combined = data.reduce((a, b) => a.concat(b), []);

    yield { type: ServerSentEvents.LOADED_USER_DATA };
    return combined;
}

async function* loadOrganizationData(user: WhoAmI, token: AuthToken, config: ConfigV1): Loader<PullRequest[]> {
    yield { type: ServerSentEvents.LOADING_ORG_DATA };
    const queries: Promise<PullRequest[]>[] = config.sources
        .filter(isOrganizationSource)
        .map((source) => GithubQueryBuilder.build_org_query(user.name, source))
        .map((query) => Fetcher.fetch(token.token, query));

    const data: Array<PullRequest[]> = await Promise.all(queries);
    const combined = data.reduce((a, b) => a.concat(b), []);
    yield { type: ServerSentEvents.LOADED_ORG_DATA };
    return combined;
}

async function* prioritizePullrequests(user:WhoAmI, allPreviousPrs: PrioritizedPullRequest[], userPRs: PullRequest[], orgPRs: PullRequest[]): Loader<PrioritizedPullRequest[]> {
    yield { type: ServerSentEvents.PRIORITIZING_PULL_REQUESTS };
    const previousMap: Record<string, PrioritizedPullRequest | undefined>= allPreviousPrs
        .reduce((acc, el) => {
            acc[el.url] = el;
            return acc;
        }, {} as Record<string, PrioritizedPullRequest>);

    const all_pullrequets = userPRs.concat(orgPRs)
        .filter((pr) => !pr.isDraft)
        .map((pr, i) => {
            let update_state = UpdateState.NO_CHANGE;
            const previous: PrioritizedPullRequest | undefined = previousMap[pr.url];
            if (previous === undefined) {
                update_state = UpdateState.NEW;
            } else if (previous.updatedAt !== pr.updatedAt) {
                update_state = UpdateState.UPDATED
            }
            return ({...pr, priority: 0, update_state });
        });

    const unique_pullrequests = uniqueBy(all_pullrequets, (pr) => pr.url);
    const all_repos: Repository[] = unique_pullrequests.map((pr) => pr.baseRepository)
    const unique_repos = uniqueBy(all_repos, (repo) => repo.url);
    const classifier = pull_request_classifier_factory(user.name);
    const classified_pullrequests = unique_pullrequests
        .map((pr) => ({...pr, priority: classifier(pr) }))
        .sort((a, b) => b.priority - a.priority);

    yield { type: ServerSentEvents.PRIORITIZED_PULL_REQUESTS };

    return classified_pullrequests;
}

async function* storeData(data: PrioritizedPullRequest[]): Loader<PrioritizedPullRequest[]> {
    yield { type: ServerSentEvents.STORING_DATA };
    yield { type: ServerSentEvents.STORED_DATA, data };
    return data;
}
