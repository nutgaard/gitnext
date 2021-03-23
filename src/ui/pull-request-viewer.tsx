import React from "react";
import {Box, Spacer, Text} from "ink";
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en'
import {PrioritizedPullRequest, Priority} from "../domain";
import * as style from "./style";
import {ellipsis_textbox} from "./text-utils";
import AttributeList, {Attribute} from "./attribute-list";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo();

interface Props {
    columns: number;
    rows: number;
    pullRequest: PrioritizedPullRequest | undefined;
}

function followUp(priority: Priority): string {
    switch (priority) {
        case Priority.NO_REVIEWS:
            return "Pull request has no reviews. Hurry up and be first"
        case Priority.MISSING_REVIEW_FROM_USER:
            return "Pull request is missing a review from you"
        case Priority.REJECTED_PR_FROM_USER:
            return "Your PR has an RFC. Maybe something to do here?"
        case Priority.APPROVED_PR_FROM_USER:
            return "Your PR has been approved. Merge it?"
        case Priority.PENDING_PR_FROM_USER:
            return "Your PR has no reviews :( "
        case Priority.NO_NEED_FOR_ACTION:
            return "All good. Author should be merging this anytime."
    }
}

function PullRequestViewer(props: Props) {
    const {columns, pullRequest} = props;

    if (pullRequest === undefined) {
        return null;
    }

    const lastUpdated: Date = new Date(pullRequest.updatedAt ?? pullRequest.createdAt);
    const attributes: Array<Attribute | React.ReactElement> = [
        {title: 'Title', content: pullRequest.title},
        {title: 'Author', content: pullRequest.author},
        {title: 'Updated', content: timeAgo.format(lastUpdated) },
        {title: 'URL', content: pullRequest.url, marginBottom: 1},
        {
            title: 'Body',
            content: ellipsis_textbox(
                pullRequest.body,
                {columns: columns - 10, rows: props.rows - 15 }
            ),
            marginBottom: 1
        },
        <Spacer/>,
        {title: 'Action', content: followUp(pullRequest.priority), marginBottom: 1}
    ];

    return (
        <Box
            borderStyle={style.borderType} //ALSO HERE
            borderColor={style.gradientStart}
            width={columns}
            margin={-1}
            flexDirection="column"
        >
            <Text color={style.gradientStart} bold underline>Description</Text>
            <Box marginTop={1} flexGrow={1} flexDirection={"column"}>
                <AttributeList attributes={attributes} />
            </Box>
        </Box>
    );
}

export default PullRequestViewer;