import {AsyncConnectionFactory, AsyncData} from "../server/async-loading/async-controller";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ClientSentEvents, ServerSentEvents, ServerSentMessages, writeClientMessage} from "../common/ws-message-formats";
import {PrioritizedPullRequest} from "../domain";

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

interface LoaderData {
    phase: Phase;
    error?: Error;
    data?: PrioritizedPullRequest[],
    reload(): void;
}

interface LoaderData {
    phase: Phase;
    error?: Error;
    data?: PrioritizedPullRequest[],
    reload(): void;
}

export function useAsyncLoader(connectionFactory: AsyncConnectionFactory): LoaderData {
    const connection = useMemo(() => connectionFactory.connect(), []);
    const [phase, setPhase] = useState<Phase>(Phase.INIT);
    const [data, setData] = useState<PrioritizedPullRequest[]>([]);
    const [error, setError] = useState<Error | undefined>(undefined);

    const reload = useCallback(() => {
        connection.send(writeClientMessage({ type: ClientSentEvents.LOAD_DATA }));
    }, [connection]);

    useEffect(() => {
        connection.on('message', (data: AsyncData) => {
            const event: ServerSentMessages = JSON.parse(data);
            switch (event.type) {
                case ServerSentEvents.LOADING_CONFIG: {
                    setPhase(Phase.LOAD_CONFIG);
                    return;
                }
                case ServerSentEvents.VERIFYING_USER: {
                    setPhase(Phase.VERIFY_USER);
                    return;
                }
                case ServerSentEvents.GETTING_TOKEN: {
                    setPhase(Phase.GET_TOKEN);
                    return;
                }
                case ServerSentEvents.LOADING_STORED_DATA: {
                    setPhase(Phase.GET_DATA_1);
                    return;
                }
                case ServerSentEvents.LOADED_STORED_DATA: {
                    setData(event.data);
                    return;
                }
                case ServerSentEvents.LOADING_USER_DATA: {
                    setPhase(Phase.GET_DATA_2);
                    return;
                }
                case ServerSentEvents.LOADING_ORG_DATA: {
                    setPhase(Phase.GET_DATA_3);
                    return;
                }
                case ServerSentEvents.STORED_DATA: {
                    setData(event.data);
                    setPhase(Phase.DONE);
                    return;
                }
                case ServerSentEvents.ERROR: {
                    setError(new Error(event.error));
                    return;
                }
            }
            console.log('message', typeof data);
        });
        connection.on('open', () => {
            connection.send(writeClientMessage({ type: ClientSentEvents.LOAD_DATA }));
        });
    }, [connection]);

    return {
        phase,
        error,
        data,
        reload
    };

}