import ChildSpawner from 'child_process';

type ReadBuffer = 'STDOUT' | 'STDERR';
export function exec_raw(cmd: string, args: string[], buffers: ReadBuffer[] = ['STDOUT']): Promise<string> {
    return new Promise((resolve, reject) => {
        const stdout_buffer: string[] = [];

        const child = ChildSpawner.spawn(cmd, args);
        if (buffers.includes('STDOUT')) {
            child.stdout.on('data', (data: Buffer) => {
                stdout_buffer.push(data.toString('utf8'));
            });
        }
        if (buffers.includes('STDERR')) {
            child.stderr.on('data', (data: Buffer) => {
                stdout_buffer.push(data.toString('utf8'));
            });
        }
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout_buffer.join(''));
            } else {
                reject(stdout_buffer.join(''));
            }
        });
    });
}

export function exec(cmdline: string, buffers: ReadBuffer[] = ['STDOUT']): Promise<string> {
    const fragments = cmdline.split(' ');
    const cmd = fragments.slice(0, 1)[0];
    const args = fragments.slice(1);

    return exec_raw(cmd, args, buffers);
}