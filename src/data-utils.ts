import {Priority, PullRequest} from "./domain";

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

export function pull_request_classifier_factory(name: string) {
    return (pr: PullRequest) => {
        const is_by_user = pr.author === name;
        const has_reviews = pr.reviews.length > 0;
        const is_mergeable = pr.mergeable === 'MERGEABLE';
        const has_review_from_user = pr.reviews.some((review) => review.reviewer === name);
        const is_approved = pr.reviews.every((review) => review.state === 'APPROVED');
        const is_rejected = pr.reviews.every((review) => review.state === 'CHANGES_REQUESTED');

        if (is_by_user) {
            if (!has_reviews) return Priority.PENDING_PR_FROM_USER;
            else if (is_approved) return Priority.APPROVED_PR_FROM_USER;
            else if (is_rejected) return Priority.REJECTED_PR_FROM_USER;
            else if (!is_mergeable) return Priority.REJECTED_PR_FROM_USER;
            else return Priority.PENDING_PR_FROM_USER;
        } else {
            if (!has_reviews) return Priority.NO_REVIEWS;
            else if (!has_review_from_user) return Priority.MISSING_REVIEW_FROM_USER;
            else return Priority.NO_NEED_FOR_ACTION;
        }
    };
}