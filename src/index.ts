#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import { cli, debugMode } from './program-config';
import App from './ui/app';
import { runAsync } from "./program-utils";
import { debugProgram } from './debug-program';
import { writeDefaultConfig } from "./config-loader";

if (debugMode) {
    runAsync(debugProgram);
} else if (cli.input.length > 0 && cli.input[0] === 'init') {
    writeDefaultConfig()
} else {
    // Allows us to use the fullscreen without clearing existing data
    const enterAltScreenCommand = "\x1b[?1049h";
    const leaveAltScreenCommand = "\x1b[?1049l";
    // process.stdout.write(enterAltScreenCommand);
    process.on("exit", () => {
        console.log('exiting');
        // process.stdout.write(leaveAltScreenCommand);
    });

    const view = React.createElement(App);
    render(view);
}