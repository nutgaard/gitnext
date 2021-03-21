import React from 'react';
import {Box, Text} from 'ink';
import {PrioritizedPullRequest} from "../domain";
import PullRequestListSelector from "./pull-request-list-selector";
import BigText from "ink-big-text";
import * as style from "./style";
import PullRequestViewer from "./pull-request-viewer";
import {useScreenSize} from "./fullscreen";

const LOGO_SIZE = 12;

function NoPullRequests() {
    return (
        <Box
            borderStyle={style.borderType}
            borderColor={style.gradientStart}
            height={20}
            flexGrow={1}
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
        >
            <Text>No pull requests needs attention.</Text>
            <BigText
                text="Awesome job"
                font="slick"
                colors={[style.gradientStart, style.gradientEnd]}
            />
        </Box>
    );
}

const leftColumnPercentage = 0.35;
interface Props {
    pullRequests: PrioritizedPullRequest[];
    selectedPullRequest: PrioritizedPullRequest | undefined;
    setSelectedPullRequest: (value: PrioritizedPullRequest) => void;
}
function PullRequestListViewer(props: Props) {
    const size = useScreenSize();
    const leftColumnSize = Math.floor(size.columns * leftColumnPercentage);
    const rightColumnSize = size.columns - leftColumnSize;
    const maxHeight = size.rows - LOGO_SIZE;

    if (props.selectedPullRequest === undefined) {
        return <NoPullRequests/>
    }

    return (
        <Box
            borderStyle={style.borderType}
            borderColor={style.gradientStart}
            flexGrow={1}
        >
            <PullRequestListSelector
                columns={leftColumnSize}
                rows={maxHeight}
                pullRequests={props.pullRequests}
                selectedPR={props.selectedPullRequest}
                setSelectedPr={props.setSelectedPullRequest}
            />
            <PullRequestViewer
                columns={rightColumnSize}
                rows={maxHeight}
                pullRequest={props.selectedPullRequest}
            />
        </Box>
    );
}

export default PullRequestListViewer;