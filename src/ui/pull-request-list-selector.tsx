import React, {useEffect} from 'react';
import {Box, Text, Spacer} from 'ink'
import {PrioritizedPullRequest, UpdateState} from "../domain";
import Select, {ItemProps} from 'ink-select-input';
import * as style from './style';
import {ellipsis} from "./text-utils";

interface Props {
    columns: number;
    rows: number;
    pullRequests: PrioritizedPullRequest[];
    selectedPR: PrioritizedPullRequest | undefined;
    setSelectedPullRequest: (select: PrioritizedPullRequest | undefined) => void;
}

function Indicator({ isSelected }: { isSelected?: boolean; }) {
    return (
        <Box marginRight={0}>
            {isSelected ? <Text color={style.gradientStart}>{'>'}</Text> : <Text> </Text>}
        </Box>
    );
}

const Item: React.FC<ItemProps> = (props: ItemProps) => {
    // Needed hack to bypass restriction in typesetting
    const castedProps = props as ( ItemProps & { value: PrioritizedPullRequest });
    let updated = <Text>  </Text>;
    if (castedProps.value.update_state === UpdateState.NEW) {
        updated = <Text color={style.greenAccent}>★ </Text>
    } else if (castedProps.value.update_state === UpdateState.UPDATED) {
        updated = <Text color={style.gradientEnd}>★ </Text>
    }
    return (
        <>
            {updated}
            <Text color={props.isSelected ? 'blue' : undefined}>{props.label}</Text>
        </>
    );
}

function PullRequestListSelector(props: Props) {
    const items = props.pullRequests.map((pr) => ({
        ...pr,
        label: ellipsis(pr.title, props.columns - 5),
        key: pr.url,
        value: pr
    }));
    const keys = items.map(({ key }) => key).join('||');

    useEffect(() => {
        if (props.pullRequests.length > 0) {
            props.setSelectedPullRequest(props.pullRequests[0]);
        } else {
            props.setSelectedPullRequest(undefined);
        }
    }, [keys]);

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
                itemComponent={Item}
                limit={props.rows - 5}
                onHighlight={(item) => props.setSelectedPullRequest(item.value)}
            />
            <Spacer />
            <Box marginLeft={1}>
                <Box marginRight={4}>
                    <Text color={style.greenAccent}>★ </Text>
                    <Text>New</Text>
                </Box>
                <Box>
                    <Text color={style.gradientEnd}>★ </Text>
                    <Text>Changed</Text>
                </Box>
            </Box>
        </Box>
    );
}

export default PullRequestListSelector;