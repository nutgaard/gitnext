import fs from 'fs';
import path from "path";
import os from "os";
import { green, cyan } from 'chalk';
import Yaml, {FAILSAFE_SCHEMA, YAMLException} from "js-yaml";
import validate, {Errors, isLeft, Validation} from "./config-validator";
import {Config} from "./config-types";
import {exit_error, error_message} from "./program-utils";
import { useTestConfig } from './program-config';

const defaultConfig = fs.readFileSync(__dirname + '/default-config.yaml', 'utf8');

export function writeDefaultConfig(){
    const location = getConfigLocation();
    const exists = fs.existsSync(location);
    if (exists){
        console.error(cyan('[INFO]'), 'Config file already exists at: ' + location);
        console.log();
        process.exit(0);
    }
    fs.writeFileSync(location, defaultConfig, { encoding: 'utf8' });
    console.log(green('[OK]'), 'Created a default configuration for at ' + location);
    console.log();
}

export function getConfigLocation(): string {
    let config_source = path.join(os.homedir(), '.gitnext.yaml');
    if (useTestConfig) {
        config_source = 'config.yaml';
    }
    return config_source;
}

export function load_and_validate(): Config {
    const value: Validation<Errors, Config> = load_and_validate_raw(getConfigLocation());
    if (isLeft(value)) {
        exit_error(value.left.join('\n'));
        throw new Error("just here to inform TS");
    } else {
        return value.right;
    }
}

export function load_and_validate_raw(filename: string): Validation<Errors, Config> {
    if (!fs.existsSync(filename)) {
        writeDefaultConfig();
    }
    const source = fs.readFileSync(filename, 'utf8');
    const config = Yaml.load(source, {
        filename,
        onWarning(e: YAMLException) {
            exit_error(error_message(e));
        },
        schema: FAILSAFE_SCHEMA
    });

    return validate(config);
}