import {Config} from "../config-types";
import {load_and_validate} from "../config-loader";
import * as GH from "../gh-utils";
import {AuthToken, WhoAmI} from "../gh-utils";
import * as GithubQueryBuilder from "../github-graphql-query-builder";
import {Query} from "../github-graphql-query-builder";
import {PrioritizedPullRequest, PullRequest, Repository, UpdateState} from "../domain";
import * as Fetcher from "../github-graphql-fetcher";
import {pull_request_classifier_factory, uniqueBy} from "../data-utils";
import React, {useCallback, useEffect, useState} from "react";
import Spinner from "ink-spinner";
import {Box, Text} from "ink";
import {useScreenSize} from "./fullscreen";
import {error_message} from '../program-utils';

export enum Phase {
    INIT = 'Initializing...',
    LOAD_CONFIG = 'Loading configuration',
    VERIFY_USER = 'Verifying user',
    GET_TOKEN = 'Retrieving auth token',
    GET_DATA_1 = 'Loading data',
    GET_DATA_2 = 'Removing duplicate repositories',
    GET_DATA_3 = 'Prioritizing pull requests',
    DONE = 'Done...',
    ERROR = 'ERROR'
}

export function LoaderComponent(props: { phase: Phase, error?: Error }) {
    const screenSize = useScreenSize();
    const content = props.error
        ? (
            <>
                <Text color="red">{error_message(props.error)}</Text>
            </>
        )
        : (
            <>
                <Spinner type={"aesthetic" as any}/>
                <Text>{props.phase}</Text>
            </>
        );
    return (
        <Box
            width={screenSize.columns}
            height={screenSize.rows - 30}
            flexGrow={1}
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
        >
            {content}
        </Box>
    );
}

interface LoaderData {
    phase: Phase;
    error?: Error;
    data?: PrioritizedPullRequest[],
    reload(): void;
}
export function useLoader(): LoaderData {
    const [phase, setPhase] = useState<Phase>(Phase.INIT);
    const [config, setConfig] = useState<Config | undefined>(undefined);
    const [whoami, setWhoami] = useState<WhoAmI | undefined>(undefined);
    const [token, setToken] = useState<AuthToken | undefined>(undefined);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [pullRequests, setPullRequests] = useState<PrioritizedPullRequest[]>([]);
    const [error, setError] = useState<Error | undefined>(undefined);
    const [hasBeenDone, setHasBeenDone] = useState<boolean>(false);
    const reload = useCallback(() => setPhase((current) => {
        if (current === Phase.ERROR) {
            return Phase.INIT;
        } else {
            return Phase.GET_DATA_1;
        }
    }), [setPhase]);

    useEffect(() => {
        (async () => {
            try {
                switch (phase) {
                    case Phase.INIT: {
                        setPhase(Phase.LOAD_CONFIG);
                        return;
                    }
                    case Phase.LOAD_CONFIG: {
                        setConfig(load_and_validate());
                        setPhase(Phase.VERIFY_USER);
                        return;
                    }
                    case Phase.VERIFY_USER: {
                        const whoami = await GH.whoami();
                        setWhoami(whoami);
                        setPhase(Phase.GET_TOKEN);
                        return;
                    }
                    case Phase.GET_TOKEN: {
                        const token = await GH.findAuthToken();
                        setToken(token);
                        setPhase(Phase.GET_DATA_1);
                        return;
                    }
                    case Phase.GET_DATA_1: {
                        const queries: Query[] = GithubQueryBuilder.build_query(whoami!!.name, config!!);
                        const data: Array<PullRequest[]> = await Promise.all(queries.map((query) =>
                            Fetcher.fetch(token!!.token, query)
                        ));
                        const previousMap: Record<string, PrioritizedPullRequest>= pullRequests
                            .reduce((acc, el) => {
                                acc[el.url] = el;
                                return acc;
                            }, {} as Record<string, PrioritizedPullRequest>);

                        const all_pullrequets: PrioritizedPullRequest[] = data
                            .reduce((a, b) => a.concat(b), [])
                            .filter((pr) => !pr.isDraft)
                            .map((pr, i) => {
                                let update_state = UpdateState.NO_CHANGE;
                                const previous: PrioritizedPullRequest | undefined = previousMap[pr.url];
                                // TODO we probably should store the results, and that way we can compare with previous version on startup
                                // This is kinda hacky, but should go away in daemonized version
                                if (hasBeenDone && previous === undefined) {
                                    update_state = UpdateState.NEW;
                                } else if (hasBeenDone && previous.updatedAt !== pr.updatedAt) {
                                    update_state = UpdateState.UPDATED
                                }
                                return ({...pr, priority: 0, update_state });
                            });
                        const all_repos: Repository[] = all_pullrequets.map((pr) => pr.baseRepository)

                        setPullRequests(uniqueBy(all_pullrequets, (pr) => pr.url));
                        setRepositories(all_repos);
                        setPhase(Phase.GET_DATA_2);
                        return;
                    }
                    case Phase.GET_DATA_2: {
                        const unique_repos: Repository[] = uniqueBy(repositories, (repo) => repo.url);
                        setRepositories(unique_repos);
                        setPhase(Phase.GET_DATA_3);
                        return;
                    }
                    case Phase.GET_DATA_3: {
                        const pr_classifier = pull_request_classifier_factory(whoami!!.name)
                        const prs_prioritized: PrioritizedPullRequest[] = pullRequests!!
                            .map((pr) => ({...pr, priority: pr_classifier(pr)}))
                            .sort((a, b) => b.priority - a.priority);
                        setPullRequests(prs_prioritized);
                        setPhase(Phase.DONE);
                        setHasBeenDone(true);
                        return;
                    }
                    case Phase.DONE: {
                        return;
                    }
                }
            } catch (e: any) {
                if (e instanceof Error) {
                    setError(e);
                } else {
                    setError(new Error(e));
                }
                setPhase(Phase.ERROR);
            }
        })();
    }, [phase]);

    return {
        phase,
        error,
        data: hasBeenDone ? pullRequests : undefined,
        reload
    };
}