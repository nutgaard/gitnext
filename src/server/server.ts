import {runAsync} from '../program-utils';
import {startWSServer} from "./async-loading/ws-server";
import {startEventEmitter} from "./async-loading/eventemitter-server";
import {ClientSentEvents, writeClientMessage} from "../common/ws-message-formats";
import * as Log from './logging';

const args = process.argv.slice(2);

runAsync(async () => {
    if (args.includes('--web')) {
        await startWSServer();
    } else {
        const clientFactory = await startEventEmitter();
        const client = clientFactory.connect();
        client.send(writeClientMessage({ type: ClientSentEvents.LOAD_DATA }));
        client.on('message', (data) => {
            Log.log('Client received: ' + JSON.stringify(data));
        })
    }
});

process.on('uncaughtException', error => Log.log(error.stack || 'SERVER Unknown error'));
process.on('exit', () => Log.log('SERVER exit'));
process.on('SIGTERM', () => Log.log('SERVER SIGTERM'));