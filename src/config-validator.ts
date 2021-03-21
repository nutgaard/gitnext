import {
    Config,
    UserSource,
    OrganizationSource,
    TeamReference,
    UserReference,
    RepoReference
} from './config-types';

export type Left<T> = { readonly _tag: 'left';  left: T; };
export type Right<T> = { readonly _tag: 'right';  right: T; };
export type Errors = Array<string>;
export type Validation<ERROR, DATA> = Left<ERROR> | Right<DATA>
const left = <T>(value: T) => ({ _tag: 'left', left: value }) as Left<T>;
const right = <T>(value: T) => ({ _tag: 'right', right: value }) as Right<T>;

export function isLeft<ERROR, DATA>(validation: Validation<ERROR, DATA>): validation is Left<ERROR> {
    return validation._tag === 'left';
}
export function isRight<ERROR, DATA>(validation: Validation<ERROR, DATA>): validation is Right<DATA> {
    return validation._tag === 'right';
}

function validate_ignore_list(config: any, context: string): Validation<Errors, Array<RepoReference | UserReference>> {
    const errors: Array<string> = [];
    const ignore: Array<RepoReference | UserReference> = [];

    if (!Array.isArray(config)) {
        return left([`'${context}.ignore' is required to be 'undefined' or an 'Array'`]);
    }
    for (let i = 0; i < config.length; i++) {
        const ignore_item = config[i];
        const ignore_context = `${context}.ignore[${i}]`
        const keys = Object.keys(ignore_item);
        const has_username = ignore_item.hasOwnProperty('username');
        const has_repo = ignore_item.hasOwnProperty('repo');
        if (keys.length !== 1) {
            errors.push(`'${ignore_context}' had more than 1 key; '${keys.join(', ')}'. Expected just one of: 'repo', 'username'`);
        } else if (!has_repo && !has_username) {
            errors.push(`'${ignore_context}' had no matching keys; '${keys.join(', ')}'. Expected one of: 'repo', 'username'`);
        } else if (has_username && typeof ignore_item.username !== 'string') {
            errors.push(`'${ignore_context}.username' has wrong type: ${typeof ignore_item.username}, expected a string.`);
        } else if (has_repo && typeof ignore_item.repo !== 'string') {
            errors.push(`'${ignore_context}.repo' has wrong type: ${typeof ignore_item.repo}, expected a string.`)
        } else {
            ignore.push(ignore_item as any);
        }
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right(ignore);
    }
}

function validate_include_list(config: any, context: string): Validation<Errors, Array<TeamReference | RepoReference>> {
    const errors: Array<string> = [];
    const include: Array<TeamReference | RepoReference> = [];

    if (!Array.isArray(config) || config.length === 0) {
        return left([`'${context}.include' must be an Array of non-zero length`]);
    }
    for (let i = 0; i < config.length; i++) {
        const include_item = config[i];
        const include_context = `${context}.include[${i}]`
        const keys = Object.keys(include_item);
        const has_team = include_item.hasOwnProperty('team');
        const has_repo = include_item.hasOwnProperty('repo');

        if (keys.length !== 1) {
            errors.push(`'${include_context}' had more than 1 key; '${keys.join(', ')}'. Expected just one of: 'team', 'repo'`);
        } else if (!has_repo && !has_team) {
            errors.push(`'${include_context}' had no matching keys; '${keys.join(', ')}'. Expected one of: 'team', 'repo'`);
        } else if (has_team && typeof include_item.team !== 'string') {
            errors.push(`'${include_context}.team' has wrong type: ${typeof include_item.team}, expected a string.`);
        } else if (has_repo && typeof include_item.repo !== 'string') {
            errors.push(`'${include_context}.repo' has wrong type: ${typeof include_item.repo}, expected a string.`)
        } else {
            include.push(include_item as any);
        }
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right(include);
    }
}

function validate_user_config(config: any, context: string): Validation<Errors, UserSource> {
    const errors: Array<string> = [];
    if (typeof config.username !== 'string') {
        errors.push(`'${context}.username' must be a string`);
    }
    const username: string = config.username;
    let ignore: Array<RepoReference | UserReference> = [];

    if (config.ignore) {
        const ignore_validation = validate_ignore_list(config.ignore, context);
        if (isRight(ignore_validation)) {
            ignore = ignore_validation.right;
        } else {
            errors.push(...ignore_validation.left);
        }
    }
    if (errors.length > 0) {
        return left(errors);
    } else {
        return right({ username, ignore });
    }
}

function validate_org_config(config: any, context: string): Validation<Errors, OrganizationSource> {
    const errors: Array<string> = [];
    if (typeof config.organization !== 'string') {
        errors.push(`'${context}.organization' must be a string`);
    }
    const organization: string = config.organization;
    let ignore: Array<RepoReference | UserReference> = [];
    let include: Array<TeamReference | RepoReference> = [];

    const include_validation = validate_include_list(config.include, context);
    if (isRight(include_validation)) {
        include = include_validation.right;
    } else {
        errors.push(...include_validation.left);
    }

    if (config.ignore) {
        const ignore_validation = validate_ignore_list(config.ignore, context);
        if (isRight(ignore_validation)) {
            ignore = ignore_validation.right;
        } else {
            errors.push(...ignore_validation.left);
        }
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right({ organization, include, ignore });
    }
}

export default function validate(config: any): Validation<Errors, Config> {
    const errors: Array<string> = [];
    const validated_config: Config = { sources: [] };
    if (!config || !config.hasOwnProperty('sources')) {
        return left(["Yaml must contains a 'sources' property."])
    } else if (config.sources.length === 0) {
        return left(["'sources' property cannot have zero length."])
    }
    for (let i = 0; i < config.sources.length; i++) {
        const source = config.sources[i];
        const context = `sources[${i}]`;
        const has_username = source.hasOwnProperty('username');
        const has_organization = source.hasOwnProperty('organization');
        if (has_organization && has_username) {
            return left([`'${context}' had both 'username' and 'organization' property. Just one is permitted at root level`]);
        } else if (!has_organization && !has_username) {
            return left([`'${context}' did not include 'username' or 'organization' property. One of these are required`]);
        }
        if (has_username) {
            const validated_source = validate_user_config(source, context);
            if (isRight(validated_source)) {
                validated_config.sources.push(validated_source.right);
            } else {
                errors.push(...validated_source.left);
            }
        } else if (has_organization) {
            const validated_source = validate_org_config(source, context);
            if (isRight(validated_source)) {
                validated_config.sources.push(validated_source.right);
            } else {
                errors.push(...validated_source.left);
            }
        }
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right(validated_config);
    }
}