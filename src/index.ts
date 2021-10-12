#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import chalk from 'chalk';
import { cli, debugMode } from './program-config';
import * as Log from './server/logging';
import App from './ui/app';
import { runAsync } from "./program-utils";
import { debugProgram } from './debug-program';
import {getConfigLocation, load_and_validate_raw, writeDefaultConfig} from "./config/config-loader";
import {startEventEmitter} from "./server/async-loading/eventemitter-server";
import {AsyncConnectionFactory} from "./server/async-loading/async-controller";
import {isLeft, Validation} from "./config/validation";
import {ConfigV1} from "./config/config-types";
import {Errors} from "./config/config-validator";
import {startWSServer} from "./server/async-loading/ws-server";

export type Backbone = () => Promise<AsyncConnectionFactory>;
export type Renderer = (backbone: Backbone) => Promise<void>;

Log.clear();
Log.log('Starting GitNext');
if (debugMode) {
    Log.log('Debug Mode activaed.. :O');
}

if (cli.input.length > 0 && cli.input[0] === 'init') {
    Log.log('No Config found, or init argument passed');
    writeDefaultConfig()
} else {
    Log.log('Loading configuration');
    const configValidation: Validation<Errors, ConfigV1> = load_and_validate_raw(getConfigLocation())
    if (isLeft(configValidation)) {
        Log.log('Invalid configuration at startup: ' + JSON.stringify(configValidation.left));
        configValidation.left.forEach((error) => {
            console.error(`[${chalk.red('ERROR')}] ${error}`);
        });
        process.exit(1);
    }
    Log.log('Configuration loaded: ' + JSON.stringify(configValidation.right, null, 2));
    const config: ConfigV1 = configValidation.right;

    const backboneOption = config.config?.backbone ?? 'eventemitter';
    const rendererOption = config.config?.renderer ?? 'terminal';

    const backbone: Backbone = backboneOption === 'eventemitter' ? startWSServer : startWSServer;
    let renderer: Renderer = rendererOption === 'terminal' ? terminalProgram : webProgram;
    if (debugMode) {
        renderer = debugProgram;
    }

    runAsync(async () => {
        await renderer(backbone);
    });
}
async function terminalProgram(backbone: Backbone) {
    // Allows us to use the fullscreen without clearing existing data
    Log.log('Starting terminal program');
    const connectionFactory = await backbone();
    // const enterAltScreenCommand = "\x1b[?1049h";
    // const leaveAltScreenCommand = "\x1b[?1049l";
    // process.stdout.write(enterAltScreenCommand);
    Log.log('Registering on-exit handler');

    process.on("exit", () => {
        console.log('index got exit');
        Log.log('Reset terminal alt-screen');
        connectionFactory.exit();
        // process.stdout.write(leaveAltScreenCommand);
        Log.log('Exitted terminal program');
    });

    const view = React.createElement(App, { connectionFactory });
    render(view);
}
async function webProgram(backbone: Backbone) {
    console.error(`[${chalk.red('ERROR')}] Web-renderer not supperted yet`);
}