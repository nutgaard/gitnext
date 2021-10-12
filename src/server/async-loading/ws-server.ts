import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import detectPort from "detect-port";
import * as Log from '../logging';
import AsyncController, {AsyncConnection, AsyncConnectionFactory, AsyncData} from "./async-controller";
import {guid} from "../utils";
import fetch from "node-fetch";
import {ConfigV1} from "../../config/config-types";

interface IdentifiableWebSocket extends WebSocket {
    id: string;
}

const port = 8099;
const WELCOME_TEXT = 'Welcome to GitNext';
export async function startWSServer(): Promise<AsyncConnectionFactory> {
    const _port = await detectPort(port);
    if (_port !== port) {
        Log.log(`Port ${port} occupied, checking port.`);
        const appurl =`http://localhost:${port}/`;
        const response = await fetch(appurl);
        const content = await response.text();
        if (content === WELCOME_TEXT) {
            Log.log(`Port ${port} was running gitnext, reusing instance.`);
            return {
                connect(): AsyncConnection {
                    return new WebSocket(`ws://localhost:${port}/gitnext`);
                },
                exit() {
                }
            };
        } else {
            Log.log(`Port ${port} was running something else, starting on port ${_port}.`);
        }
    }
    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server, path: '/gitnext' });
    const wsControll = new AsyncController();

    wss.on('connection', (ws: IdentifiableWebSocket) => {
        ws.id = guid()
        wsControll.register(ws);
        ws.on('error', () => {
            Log.log('error, unregistering ws ' + ws.id);
            wsControll.unregister(ws);
        });
        ws.on('close', () => {
            Log.log('close, unregistering ws ' + ws.id);
            wsControll.unregister(ws);
        });

        Log.log('New connection ' + ws.id);
        ws.on('message', (data) => {
            wsControll.process(ws, data as AsyncData);
        });
    });

    app.get('/', (req, res) => {
        res.send(WELCOME_TEXT);
    });

    server.listen(_port);
    Log.log(`Started server on http://localhost:${_port}`);

    process.on('uncaughtException', error => Log.log(error.stack || 'Unknown error'));
    process.on('exit', () => {
        Log.log('WSSERVER Exit');
    });
    process.once('SIGTERM', () => {
        Log.log('WSSERVER SIGTERM');
        Log.log('Stopping daemon');
        server.on('close', () => {
            Log.log('Stopped');
            process.exit(0);
        });
        server.close();
    });

    return {
        connect(): AsyncConnection {
            return new WebSocket(`ws://localhost:${_port}/gitnext`);
        },
        exit() {
            server.close();
        }
    };
}


