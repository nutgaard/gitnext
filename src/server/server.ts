import {runAsync} from '../program-utils';
import {startWSServer} from "./async-loading/ws-server";
import {startEventEmitter} from "./async-loading/eventemitter-server";
import {ClientSentEvents, writeClientMessage} from "../common/ws-message-formats";
import fetch from "node-fetch";

const args = process.argv.slice(2);

runAsync(async () => {
    if (args.includes('--web')) {
        await startWSServer();
    } else {
        const clientFactory = await startEventEmitter();
        const client = clientFactory.connect();
        client.send(writeClientMessage({ type: ClientSentEvents.LOAD_DATA }));
        client.on('message', (data) => {
            console.log('Client received', data);
        })
    }
});

process.on('uncaughtException', error => console.log(error.stack));

fetch()