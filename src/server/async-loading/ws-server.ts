import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import detectPort from "detect-port";
import AsyncController, {AsyncConnection, AsyncConnectionFactory, AsyncData} from "./async-controller";
import {guid} from "../utils";
import fetch from "node-fetch";

interface IdentifiableWebSocket extends WebSocket {
    id: string;
}

const port = 8099;
const WELCOME_TEXT = 'Welcome to GitNext';
export async function startWSServer(): Promise<AsyncConnectionFactory> {
    const _port = await detectPort(port);
    if (_port !== port) {
        console.log(`Port ${port} occupied, checking port.`);
        const appurl =`http://localhost:${port}/`;
        const response = await fetch(appurl);
        const content = await response.text();
        if (content === WELCOME_TEXT) {
            console.log(`Port ${port} was running gitnext, reusing instance.`);
            return {
                connect(): AsyncConnection {
                    return new WebSocket(`ws://localhost:${port}/gitnext`);
                }
            };
        } else {
            console.log(`Port ${port} was running something else, starting on port ${_port}.`);
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
            console.log('error, unregistering ws', ws.id);
            wsControll.unregister(ws);
        });
        ws.on('close', () => {
            console.log('close, unregistering ws', ws.id);
            wsControll.unregister(ws);
        });

        console.log('New connection', ws.id);
        ws.on('message', (data) => {
            wsControll.process(ws, data as AsyncData);
        });
    });

    app.get('/', (req, res) => {
        res.send(WELCOME_TEXT);
    });

    server.listen(_port);
    console.log(`Started server on http://localhost:${_port}`);

    process.on('uncaughtException', error => console.log(error.stack));
    process.once('SIGTERM', () => {
        console.log('Stopping daemon');
        server.on('close', () => {
            console.log('Stopped');
            process.exit(0);
        });
        server.close();
    });

    return {
        connect(): AsyncConnection {
            return new WebSocket(`ws://localhost:${_port}/gitnext`);
        }
    };
}


