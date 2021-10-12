import { ConfigV1, ConfigBeta } from './config-types';
import { validate_global_config, validate_sources } from "./config-type-validators";
import { Validation, left, right, isRight } from "./validation";

export type Errors = Array<string>;

function migrateTo10(config: ConfigBeta): ConfigV1 {
    return {
        version: '1.0',
        sources: config.sources,
        config: {
            backbone: 'eventemitter',
            renderer: 'terminal',
            daemon: false,
            ignore: []
        }
    }
}

export function validateBeta(config: any): Validation<Errors, ConfigV1> {
    const errors: Array<string> = [];
    const validated_config: ConfigBeta = { sources: [] };
    const validated_sources = validate_sources(config);
    if (isRight(validated_sources)) {
        validated_config.sources = validated_sources.right;
    } else {
        errors.push(...validated_sources.left);
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right(migrateTo10(validated_config));
    }
}

export function validateV10(config: any): Validation<Errors, ConfigV1> {
    const errors: Array<string> = [];
    if (!config.hasOwnProperty('version')) {
        return left(['Yaml file is missing a required version number.'])
    } else if (config.version !== '1.0') {
        return left([`Yaml file is referring to wrong version. Expected '1.0' but found ${config.version}`])
    }

    const validated_config: ConfigV1 = {
        version: '1.0',
        sources: []
    };

    const validated_sources = validate_sources(config);
    if (isRight(validated_sources)) {
        validated_config.sources = validated_sources.right;
    } else {
        errors.push(...validated_sources.left);
    }

    const validated_global_config = validate_global_config(config.config);
    if (isRight(validated_global_config)) {
        validated_config.config = validated_global_config.right;
    } else {
        errors.push(...validated_global_config.left);
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right(validated_config);
    }
}

type ConfigValidator<T> = (any: any) => Validation<Errors, ConfigV1>;
const validators: { [key: string]: ConfigValidator<any> } = {
    "": validateBeta,
    "beta": validateBeta,
    "1.0": validateV10
}
export default validators;