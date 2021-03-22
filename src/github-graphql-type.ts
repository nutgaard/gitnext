type Countable<T> = T extends never
    ? { totalCount: number }
    : { totalCount: number; nodes: T[]; }

export interface UserResponse {
    data: {
        user: {
            pullRequests: Countable<PullRequest>;
            repositories: Countable<Repository> & PageInfo;
        }
    }
}

export interface OrganizationResponse {
    data: {
        [key: string]: TeamResponse | RepoResponse;
    }
}

export interface TeamResponse {
    team: Team;
}

export interface RepoResponse {
    repository: Repository;
}

export interface Owner {
    login: string;
}

export interface PageInfo {
    pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
    }
}

export interface Team {
    name: string;
    description: string;
    repositories: Countable<Repository>;
}

export type RepositoryPermissions = 'ADMIN' | 'WRITE' | 'MAINTAIN' | 'READ';
export interface Repository {
    name: string;
    url: string;
    owner: Owner;
    isArchived: boolean;
    viewerPermission: RepositoryPermissions;
    diskUsage: number;
    pullRequests: Countable<PullRequest>
}

export interface PullRequest {
    author: Owner;
    title: string;
    body: string;
    bodyText: string;
    bodyHTML: string;
    changedFiles: number;
    url: string;
    baseRepository: {
        name: string;
        url: string;
        owner: Owner;
    };
    commits: Countable<never>;
    headRefName: string;
    baseRefName: string;
    createdAt: string;
    updatedAt: string | null;
    lastEditedAt: string | null;
    isDraft: boolean;
    mergeable: 'MERGEABLE' | 'CONFLICTING';
    reviews: Countable<Review>
}

interface Review {
    author: Owner;
    state: 'COMMENTED' | 'CHANGES_REQUESTED' | 'APPROVED';
    submittedAt: string;
    updatedAt: string | null;
}