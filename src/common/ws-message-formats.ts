import {PrioritizedPullRequest} from "../domain";
import {AsyncData} from "../server/async-loading/async-controller";

export interface WsMessageFormat<KEY extends string> {
    type: KEY;
}

export enum ServerSentEvents {
    WELCOME = 'SERVER/WELCOME',
    LOADING_CONFIG = 'SERVER/LOADING_CONFIG',
    LOADED_CONFIG = 'SERVER/LOADED_CONFIG',
    CREATED_DEFAULT_CONFIG = 'SERVER/CREATED_DEFAULT_CONFIG',
    VERIFYING_USER = 'SERVER/VERIFYING_USER',
    VERIFIED_USER = 'SERVER/VERIFIED_USER',
    GETTING_TOKEN = 'SERVER/GETTING_TOKEN',
    GOT_TOKEN = 'SERVER/GOT_TOKEN',
    LOADING_STORED_DATA = 'SERVER/LOADING_STORED_DATA',
    LOADED_STORED_DATA = 'SERVER/LOADED_STORED_DATA',
    LOADING_USER_DATA = 'SERVER/LOADING_USER_DATA',
    LOADED_USER_DATA = 'SERVER/LOADED_USER_DATA',
    LOADING_ORG_DATA = 'SERVER/LOADING_ORG_DATA',
    LOADED_ORG_DATA = 'SERVER/LOADED_ORG_DATA',
    PRIORITIZING_PULL_REQUESTS = 'SERVER/PRIORITIZING_PULL_REQUESTS',
    PRIORITIZED_PULL_REQUESTS = 'SERVER/PRIORITIZED_PULL_REQUESTS',
    STORING_DATA = 'SERVER/STORING_DATA',
    STORED_DATA = 'SERVER/STORED_DATA',
    ERROR = 'SERVER/ERROR'
}
const serverSentEventKeys = Object.values(ServerSentEvents);

export enum ClientSentEvents {
    HELLO = 'CLIENT/HELLO',
    LOAD_DATA = 'CLIENT/LOAD_DATA',
}
const clientSentEventKeys = Object.values(ClientSentEvents);

/**
 * Sent by server
 */
export type ServerSentMessages = WsMessageFormat<
      ServerSentEvents.WELCOME
    | ServerSentEvents.LOADING_CONFIG
    | ServerSentEvents.LOADED_CONFIG
    | ServerSentEvents.CREATED_DEFAULT_CONFIG
    | ServerSentEvents.VERIFYING_USER
    | ServerSentEvents.VERIFIED_USER
    | ServerSentEvents.GETTING_TOKEN
    | ServerSentEvents.GOT_TOKEN
    | ServerSentEvents.LOADING_STORED_DATA
    // | ServerSentEvents.LOADED_STORED_DATA
    | ServerSentEvents.LOADING_USER_DATA
    | ServerSentEvents.LOADED_USER_DATA
    | ServerSentEvents.LOADING_ORG_DATA
    | ServerSentEvents.LOADED_ORG_DATA
    | ServerSentEvents.PRIORITIZING_PULL_REQUESTS
    | ServerSentEvents.PRIORITIZED_PULL_REQUESTS
    | ServerSentEvents.STORING_DATA
    // | ServerSentEvents.STORED_DATA
    // | ServerSentEvents.ERROR
> | LoadedStoredData | StoredData | ErrorData;

type LoadedStoredData = WsMessageFormat<ServerSentEvents.LOADED_STORED_DATA> & { data: Data };
type StoredData = WsMessageFormat<ServerSentEvents.STORED_DATA> & { data: Data };
type ErrorData = WsMessageFormat<ServerSentEvents.ERROR> & { error: string };

type Data = Array<PrioritizedPullRequest>;

/**
 * Sent by client
 */
export type ClientSentMessages = WsMessageFormat<ClientSentEvents.HELLO | ClientSentEvents.LOAD_DATA>;

/**
 * Utils
 */
function readMessageFactory<T>(availableType: string[]) {
    return (message: AsyncData) => {
        const json: any = JSON.parse(message.toString());
        const type = json.type;
        if (availableType.includes(type)) {
            return json as T;
        } else {
            throw new Error('Unrecognized command: ' + message);
        }
    }
}
function writeMessageFactory<T>() {
    return (message: T) => JSON.stringify(message);
}

export const writeClientMessage = writeMessageFactory<ClientSentMessages>();
export const writeServerMessage = writeMessageFactory<ServerSentMessages>();
export const readClientMessage = readMessageFactory<ClientSentMessages>(clientSentEventKeys);
export const readServerMessage = readMessageFactory<ServerSentEvents>(serverSentEventKeys);
