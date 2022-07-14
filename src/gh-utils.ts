import fs from 'fs';
import * as Fixtures from './fixtures/fixtures';
import { exec } from './execa-lite';
import {exit_error} from "./program-utils";
import { useFixtures } from './program-config';

function execJson<T>(cmdline: string): Promise<T> {
    return exec(cmdline).then((json) => JSON.parse(json));
}

export interface WhoAmI {
    name: string;
}
export interface GhApiUser {
    id: number;
    login: string;
}
export async function whoami(): Promise<WhoAmI> {
    let res: GhApiUser;
    if (useFixtures) {
        res = await Fixtures.whoami();
    } else {
        res = await execJson('gh api user');
    }

    return { name: res.login };
}

export interface AuthToken {
    token: string;
}
export interface GhApiToken {
    token: string;
}
export async function findAuthToken(): Promise<AuthToken> {
    let res: GhApiToken | null = null;
    if (useFixtures) {
        res = await Fixtures.token();
    } else {
        const auth_status = await exec('gh auth status --show-token', ['STDERR', 'STDOUT']);
        const token_line = auth_status
            .split('\n')
            .find((line) => line.includes('Token: '));

        if (token_line) {
            const token_match = token_line.match(/Token: (.+)/);
            if (token_match) {
                res = { token: token_match[1] };
            } else {
                exit_error('Authentication status failed, could not extract location from "gh auth status".')
            }
        } else {
            exit_error('Authentication status failed, check the response of running "gh auth status".');
        }
    }

    if (res) {
        return { token: res.token };
    } else {
        exit_error('Unable to find gh token');
        throw new Error("just here to inform TS");
    }
}