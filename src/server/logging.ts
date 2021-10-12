import fs, {WriteStream} from "fs";
import path from "path";
import os from "os";

const logfile = path.join(os.homedir(), '.gitnext.log');
let logstream = openStream(logfile);

function openStream(file: string): WriteStream {
    return fs.createWriteStream(file, {
        flags: 'a',
        encoding: "utf8",
        mode: 644
    });
}

export function clear() {
    logstream.close();
    fs.truncateSync(logfile, 0);
    logstream = openStream(logfile);
}

export function log(message: string) {
    const timestamp = `[${new Date().toISOString()}] `;
    const indent = ' '.repeat(timestamp.length);
    const indentedMessage = message.split('\n')
        .map((line, i) => i > 0 ? indent + line : line)
        .join('\n');
    logstream.write(`${timestamp}${indentedMessage}\n`);
}

process.on('beforeExit', (code: number) => {
    log(`Exiting with code: ${code}`);
    logstream.close();
});
