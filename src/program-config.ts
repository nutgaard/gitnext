import meow  from 'meow';

interface CliFlags extends meow.AnyFlags {
    renderer: meow.StringFlag;
    stacktrace: meow.BooleanFlag;
    debug: meow.BooleanFlag;
}
const usage = `
    Usage
      $ gitnext
    
    Options
      --stacktrace  Prints stacktraces if a error is caught
      --debug       Loads data without UI
       
`;
const options: meow.Options<CliFlags> = {
    flags: {
        renderer: {
            type: 'string',
            default: 'terminal'
        },
        stacktrace: {
            type: 'boolean',
            default: false,
        },
        debug: {
            type: 'boolean',
            default: false
        }
    }
};

// Controll usage of fixtures, not changeable by passing cli-argument
export const useFixtures: boolean = true;
export const simulateLatency: boolean = false;

// Use config.yaml local to this repository, not changeable by passing cli-argument
export let useTestConfig: boolean = false;

export const cli = meow(usage, options);

function validateRenderer(renderer: unknown): string {
    if (renderer === 'terminal' || renderer === 'web') {
        return renderer;
    }
    throw new Error(`Illegal renderer arguments: ${renderer}. Must be one of; terminal, web`)
}

// Allows for better debugging, can be changed by cli-argument
export let renderer: string = validateRenderer(cli.flags.renderer);
export let debugMode: boolean = cli.flags.debug as boolean;
export let printStacktrace: boolean = cli.flags.stacktrace as boolean;
