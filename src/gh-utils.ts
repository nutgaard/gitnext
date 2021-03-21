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
        const auth_status = await exec('gh auth status', ['STDERR', 'STDOUT']);
        const auth_line = auth_status
            .split('\n')
            .find((line) => line.includes('Logged in to '));

        if (auth_line) {
            const match = auth_line.match(/\((.+)\)/);
            if (match) {
                const tokenLocation = match[1];
                const ghAuthData = fs.readFileSync(tokenLocation, 'utf8');
                const tokenMatch = ghAuthData.match(/oauth_token: ([\w\d]+)/);
                if (tokenMatch) {
                    res = { token: tokenMatch[1] };
                } else {
                    exit_error('Authentication status failed, could not extract token ' + tokenLocation);
                }
            } else {
                exit_error('Authentication status failed, could not extract location from "gh auth status".');
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