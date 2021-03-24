import emojiStrip from "emoji-strip";
import {OrganizationSource, RepoReference, UserReference, UserSource} from "./config-types";
import * as GithubGraphqlType from './github-graphql-type';
import {exit_error} from "./program-utils";
import { PullRequest, Review } from './domain';
import {uniqueBy} from "./data-utils";

const acceptedPermissions: GithubGraphqlType.RepositoryPermissions[] = ['ADMIN', 'WRITE', 'MAINTAIN'];
function hasAccess(repo: GithubGraphqlType.Repository) {
    return acceptedPermissions.includes(repo.viewerPermission);
}

function processTeam(ignore: Array<RepoReference | UserReference>, team: GithubGraphqlType.Team): PullRequest[] {
    return team.repositories.nodes
        .filter((repo) => !repo.isArchived)
        .flatMap((repo) => processRepo(ignore, repo));
}

function isUserReference(reference: RepoReference | UserReference): reference is UserReference {
    return reference.hasOwnProperty('username');
}

function processRepo(ignore: Array<RepoReference | UserReference>, repo: GithubGraphqlType.Repository): PullRequest[] {
    return repo.pullRequests.nodes
        .map(processPullRequest)
        .filter((pr) => {
            return ignore.every((ignore_check) => {
                if (isUserReference(ignore_check)) {
                    return pr.author !== ignore_check.username;
                } else {
                    return true;
                }
            });
        });
}

function processPullRequest(pr: GithubGraphqlType.PullRequest): PullRequest {
    const reviewers: { [key: string]: Review } = {};
    pr.latestReviews.nodes
        .filter((review) => review.state !== 'COMMENTED')
        .sort((a, b) => (a.updatedAt ?? a.submittedAt).localeCompare(b.updatedAt ?? b.submittedAt))
        .forEach((review) => {
            const data : Review = {
                reviewer: review.author.login,
                state: review.state,
                submittedAt: review.submittedAt,
                updatedAt: review.updatedAt
            };
            reviewers[data.reviewer] = data;
        });

    return {
        baseRepository: {
            owner: pr.baseRepository.owner.login,
            name: pr.baseRepository.name,
            url: pr.baseRepository.url
        },
        author: pr.author.login,
        title: emojiStrip(pr.title),
        body: emojiStrip(pr.bodyText),
        url: pr.url,
        from: pr.headRefName,
        to: pr.baseRefName,
        updatedAt: pr.updatedAt,
        createdAt: pr.createdAt,
        isDraft: pr.isDraft,
        mergeable: pr.mergeable,
        reviews: Object.values(reviewers)
    };
}

export function userQuery(config: UserSource, data: GithubGraphqlType.UserResponse[]): PullRequest[] {
    return data
        .flatMap((page) => {
            const pullrequests: PullRequest[] = page.data.user.pullRequests.nodes
                .map(processPullRequest);
            const repo_pullrequests = page.data.user.repositories.nodes
                .filter(hasAccess)
                .filter((repo) => !repo.isArchived)
                .flatMap((repo) => processRepo(config.ignore, repo));

            return uniqueBy(pullrequests.concat(repo_pullrequests), (pr) => pr.url);
        });
}

function isTeamResponse(key: string, response: GithubGraphqlType.TeamResponse | GithubGraphqlType.RepoResponse): response is GithubGraphqlType.TeamResponse {
    return key.startsWith('team_'); 
}

export function orgQuery(config: OrganizationSource, data: GithubGraphqlType.OrganizationResponse[]): PullRequest[] {
    data.length > 1 && exit_error('org query should never be paginated, found ' + data.length + ' pages.')
    const page = data[0];
    return Object.entries(page.data)
        .flatMap(([key, value]) => {
            if (isTeamResponse(key, value)) {
                return processTeam(config.ignore, value.team);
            } else if (key.startsWith('repo_')) {
                return processRepo(config.ignore, value.repository);
            } else {
                exit_error('Unknown data in key: ' + key);
                throw new Error("just here to inform TS");
            }
        });
}