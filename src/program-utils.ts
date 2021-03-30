import { red } from 'chalk';
import { printStacktrace, debugMode } from './program-config';

export function runAsync(fn: any, ...args: any[]) {
    (async () => { await fn(...args); })();
}

export function exit_error(message: string) {
    if (debugMode) {
        console.error(red('[ERROR]'), message);
        process.exit(1);
    } else {
        throw new Error(message);
    }
}

export function error_message(error: Error): string {
    if (printStacktrace) {
        return error.stack ?? error.message;
    }
    return error.message ?? error.stack ?? "Unknown error";
}