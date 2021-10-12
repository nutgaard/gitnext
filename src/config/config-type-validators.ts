import {
    Backbone, Daemon,
    GlobalConfig,
    OrganizationSource,
    Renderer,
    RepoReference, TeamReference,
    UserReference,
    UserSource
} from "./config-types";
import {Validation, left, right, isLeft, isRight} from "./validation";
import {Errors} from "./config-validator";

export function validate_ignore_list(config: any, context: string): Validation<Errors, Array<RepoReference | UserReference>> {
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

export function validate_include_list(config: any, context: string): Validation<Errors, Array<TeamReference | RepoReference>> {
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

export function validate_user_config(config: any, context: string): Validation<Errors, UserSource> {
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

export function validate_org_config(config: any, context: string): Validation<Errors, OrganizationSource> {
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

export function validate_sources(config: any): Validation<Errors, Array<UserSource | OrganizationSource>> {
    if (!config || !config.hasOwnProperty('sources')) {
        return left(["Yaml must contains a 'sources' property."])
    } else if (!Array.isArray(config.sources) || config.sources.length === 0) {
        return left(["'sources' must be an array of non-zero length."])
    }
    const validated_sources: Array<UserSource | OrganizationSource> = [];
    const errors: Errors = [];
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
                validated_sources.push(validated_source.right);
            } else {
                errors.push(...validated_source.left);
            }
        } else if (has_organization) {
            const validated_source = validate_org_config(source, context);
            if (isRight(validated_source)) {
                validated_sources.push(validated_source.right);
            } else {
                errors.push(...validated_source.left);
            }
        }
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right(validated_sources);
    }
}

export function validate_global_config(config: any): Validation<Errors, GlobalConfig> {
    const errors: Array<string> = [];
    let validated_ignore: Array<RepoReference | UserReference> = [];
    let validated_renderer: Renderer = 'terminal';
    let validated_backbone: Backbone = 'ws';
    let validated_daemon: boolean = false;
    if (config === undefined || config === null) {
        return right({
            ignore: validated_ignore,
            renderer: validated_renderer,
            backbone: validated_backbone,
            daemon: validated_daemon
        });
    }

    const ignore_list = config.ignore ?? [];
    const ignore_validation = validate_ignore_list(config.ignore ?? [], 'config');
    if (isRight(ignore_validation)) {
        validated_ignore = ignore_validation.right;
    } else {
        errors.push(...ignore_validation.left);
    }

    if (config.hasOwnProperty('renderer')) {
        const renderer = config.renderer;
        if (Renderer.includes(renderer)) {
            validated_renderer = renderer;
        } else {
            errors.push(`'config.renderer' is required to be one of: ${Renderer.join(', ')}`);
        }
    }

    if (config.hasOwnProperty('backbone')) {
        const backbone = config.backbone;
        if (Backbone.includes(backbone)) {
            validated_backbone = backbone;
        } else {
            errors.push(`'config.backbone' is required to be one of: ${Backbone.join(', ')}`);
        }
    }

    if (config.hasOwnProperty('daemon')) {
        const daemon = config.daemon;
        if (Daemon.includes(daemon)) {
            validated_daemon = daemon.toLocaleString() === 'true';
        } else {
            errors.push(`'config.daemon' is required to be one of: ${Daemon.join(', ')}`);
        }
    }

    if (validated_backbone === 'eventemitter') {
        if (validated_daemon) {
            errors.push(`'config.daemon' cannot be true when using 'eventemitter' backbone`);
        }
        if (validated_renderer === 'web') {
            errors.push(`'config.renderer' cannot be 'web' when using 'eventemitter' backbone`);
        }
    }

    if (errors.length > 0) {
        return left(errors);
    } else {
        return right({
            ignore: validated_ignore,
            renderer: validated_renderer,
            backbone: validated_backbone,
            daemon: validated_daemon
        });
    }
}