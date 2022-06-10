import {Priority, PullRequest} from "./domain";
import {log} from "./logging";

export function uniqueBy<T>(list: T[], extractKey: (t: T) => string): T[] {
    const cache: { [key: string]: T } = {};
    for (const element of list) {
        const key = extractKey(element);
        if (!cache[key]) {
            cache[key] = element;
        }
    }
    return Object.values(cache);
}

export interface BlockingMap {
    [target: string]: Array<string>
}

export function pull_request_blocker_key(pullRequest: PullRequest, outgoing: boolean): string {
    return `${pullRequest.baseRepository.name}--${outgoing ? pullRequest.from : pullRequest.to}`;
}
export function create_pull_request_blocking_map(pullRequests: Array<PullRequest>): BlockingMap {
    return pullRequests
        .reduce<BlockingMap>((acc, pr) => {
            const target = pull_request_blocker_key(pr, true);
            const targetList = acc[target] ?? [];
            acc[target] = [...targetList, pr.url];
            return acc;
        }, {});
}

export function pull_request_classifier_factory(name: string) {
    return (pr: PullRequest, blockingMap: BlockingMap) => {
        const is_by_user = pr.author === name;
        const has_reviews = pr.reviews.length > 0;
        const is_mergeable = pr.mergeable === 'MERGEABLE';

        const review_by_user = pr.reviews.find((review) => review.reviewer === name);
        const has_review_by_user = review_by_user !== undefined;
        const is_rejected_by_user = review_by_user?.state === 'CHANGES_REQUESTED';

        const blocker_key = pull_request_blocker_key(pr, false)
        const is_blocked = blockingMap[blocker_key] !== undefined;
        log(`[blocker] ${pr.url} ${is_blocked} ${blocker_key} by ${JSON.stringify(blockingMap[blocker_key])}`);
        const is_approved = pr.reviews.every((review) => review.state === 'APPROVED');
        const is_rejected = pr.reviews.some((review) => review.state === 'CHANGES_REQUESTED');

        if (is_blocked) {
            return Priority.BLOCKED_PR;
        } else if (is_by_user) {
            if (!has_reviews) return Priority.PENDING_PR_FROM_USER;
            else if (is_approved) return Priority.APPROVED_PR_FROM_USER;
            else if (is_rejected) return Priority.REJECTED_PR_FROM_USER;
            else if (!is_mergeable) return Priority.REJECTED_PR_FROM_USER;
            else return Priority.PENDING_PR_FROM_USER;
        } else {
            if (!has_reviews) return Priority.NO_REVIEWS;
            else if (!has_review_by_user) return Priority.MISSING_REVIEW_FROM_USER;
            else if (is_rejected_by_user) return Priority.PR_REJECTED_BY_USER;
            else return Priority.NO_NEED_FOR_ACTION;
        }
    };
}