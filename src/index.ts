#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import { cli, debugMode } from './program-config';
import App from './ui/app';
import { runAsync } from "./program-utils";
import { debugProgram } from './debug-program';
import { writeDefaultConfig } from "./config-loader";
import {startEventEmitter} from "./server/async-loading/eventemitter-server";
import {AsyncConnectionFactory} from "./server/async-loading/async-controller";

export type Program = (connectionFactory: AsyncConnectionFactory) => Promise<void>;

if (cli.input.length > 0 && cli.input[0] === 'init') {
    writeDefaultConfig()
} else {
    // const rendererType = cli.flags.renderer;
    // const program = debugMode ? debugProgram : terminalProgram;

    runAsync(async () => {
        console.log('Starting backend...');
        // const client = await startWSServer();
        const client = await startEventEmitter();
        console.log('client', client);
        console.log('Backend started');
        await debugProgram(client);
    });
}

const terminal: Program = async (connectionFactory) => {
    // Allows us to use the fullscreen without clearing existing data
    const enterAltScreenCommand = "\x1b[?1049h";
    const leaveAltScreenCommand = "\x1b[?1049l";
    process.stdout.write(enterAltScreenCommand);
    process.on("exit", () => {
        console.log('exiting');
        process.stdout.write(leaveAltScreenCommand);
    });

    const view = React.createElement(App);
    render(view);
}
// if (debugMode) {
//     runAsync(debugProgram);
// } else if (cli.input.length > 0 && cli.input[0] === 'init') {
//     writeDefaultConfig()
// } else {
//     terminalProgram();
// }