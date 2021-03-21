import {Priority, PullRequest, Repository} from "./domain";

export function uniqueRepos(repos: Repository[]): Repository[] {
    const set: { [key: string]: Repository[] } = {};
    repos.forEach((repo) => {
        const name = repo.url;
        const group = set[name] || [];
        group.push(repo);
        set[name] = group;
    });
    return Object.values(set)
        .map((list_of_similar_repos) => {
            const any_with_team = list_of_similar_repos.find((repo) => repo.team);
            return any_with_team ? any_with_team : list_of_similar_repos[0];
        })
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