import React from 'react';
import { Box, Text } from 'ink'
import {PrioritizedPullRequest} from "../domain";
import Select from 'ink-select-input'
import * as style from './style';
import {ellipsis} from "./text-utils";

interface Props {
    columns: number;
    rows: number;
    pullRequests: PrioritizedPullRequest[];
    selectedPR: PrioritizedPullRequest | undefined;
    setSelectedPr: (select: PrioritizedPullRequest) => void;
}

function Indicator({ isSelected }: { isSelected?: boolean; }) {
    return (
        <Box marginRight={1}>
            {isSelected ? <Text color={style.gradientStart}>{'>'}</Text> : <Text> </Text>}
        </Box>
    );
}

function PullRequestListSelector(props: Props) {
    const items = props.pullRequests.map((pr) => ({
        ...pr,
        label: ellipsis(pr.title, 65),
        key: pr.url,
        value: pr
    }));
    return (
        <Box
            width={props.columns}
            height="100%"
            flexDirection="column"
        >
            <Text color={style.gradientStart} bold underline>Pull requests ({props.pullRequests.length})</Text>
            <Select<PrioritizedPullRequest>
                isFocused={true}
                items={items}
                indicatorComponent={Indicator}
                limit={props.rows - 3}
                onHighlight={(item) => props.setSelectedPr(item.value)}
            />
        </Box>
    );
}

export default PullRequestListSelector;