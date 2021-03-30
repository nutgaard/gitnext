import fs from 'fs';
const pkg_source = fs.readFileSync('package.json', 'utf8');
const pkg = JSON.parse(pkg_source);
const version = pkg.version;

const usage = `
Usage

  Starting the application with an on-demand backend.
    $ gitnext 
  
  Options
    --terminal        Starts app in terminal
    --web             Starts app in browser, uses webserver backend.
    --daemon          Starts "backend" in daemon mode
  
  Starting backend in daemon mode. This allows faster startup times later on.
    $ gitnext daemon [status|start|stop|restart|kill]

`;

interface CliConfig {
    renderer: 'web' | 'terminal';
    showStacktraces: boolean;
    runDebugProgram: boolean;
}
const defaultConfig: CliConfig = {
    renderer: 'terminal',
    showStacktraces: false,
    runDebugProgram: false
}

export function cli(): CliConfig {
    const args = process.argv.slice(2);
    const config = { ...defaultConfig };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '-h':
            case '--help':
                console.log(usage);
                process.exit(0);
            case '-v':
            case '--version':
                console.log(version);
                process.exit(0);

            case '-w':
            case '--web': {
                config.renderer = 'web';
                break;
            }
            case '-t':
            case '--terminal':
                config.renderer = 'terminal';
                break;
            case '-s':
            case '--stacktrace':
                config.showStacktraces = true;
                break;
            case 'debug':
                config.runDebugProgram = true;
                break;
        }
    }

    return config;
}

console.log(cli());