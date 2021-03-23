export interface Repository {
    url: string;
    owner: string;
    name: string;
}

export interface PullRequest {
    baseRepository: Repository;
    author: string;
    title: string;
    body: string;
    url: string;
    from: string;
    to: string;
    createdAt: string;
    updatedAt: string | null;
    isDraft: boolean;
    mergeable: 'MERGEABLE' | 'CONFLICTING';
    reviews: Review[];
}

export enum Priority {
    NO_NEED_FOR_ACTION = 0,
    PENDING_PR_FROM_USER = 60,
    APPROVED_PR_FROM_USER = 70,
    REJECTED_PR_FROM_USER = 80,
    MISSING_REVIEW_FROM_USER = 90,
    NO_REVIEWS = 100,
}
export enum UpdateState {
    NO_CHANGE,
    NEW,
    UPDATED
}

export interface PrioritizedPullRequest extends PullRequest {
    priority: Priority;
    update_state: UpdateState
}

export interface Review {
    reviewer: string;
    state: 'COMMENTED' | 'CHANGES_REQUESTED' | 'APPROVED';
    submittedAt: string;
    updatedAt: string | null;
}