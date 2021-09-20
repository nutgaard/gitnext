import * as fs from 'fs';

const logStream = fs.createWriteStream('gitnext.log', { flags: 'a', encoding: 'utf-8', mode: 644});

export function log(message: string) {
    logStream.write(message + '\n');
}