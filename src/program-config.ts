import meow  from 'meow';

interface CliFlags extends meow.AnyFlags {
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
export const useFixtures: boolean = false;
export const simulateLatency: boolean = false;

// Use config.yaml local to this repository, not changeable by passing cli-argument
export let useTestConfig: boolean = false;

export const cli = meow(usage, options);
// Allows for better debugging, can be changed by cli-argument
export let debugMode: boolean = cli.flags.debug as boolean;
export let printStacktrace: boolean = cli.flags.stacktrace as boolean;
