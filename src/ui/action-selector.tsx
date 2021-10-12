import React from 'react';
import {AppProps, Box, Key, Text, useApp} from 'ink';
import open from 'open';
import {PrioritizedPullRequest} from "../domain";
import {Hotkey, useHotkeys} from "./use-hotkeys";
import {Phase} from "./use-async-loader";
import * as Log from '../server/logging';

interface HotkeyContext {
    pullRequest: PrioritizedPullRequest | undefined;
    app: AppProps;
    reload(): void;
    phase: Phase;
}

const donePhases: Phase[] = [Phase.DONE, Phase.ERROR];
const exitHandler: Hotkey<HotkeyContext> = {
    description: "Exit",
    hotkey: "Esc/Q",
    activate(context: HotkeyContext, input: string, key: Key): boolean {
        return input === "q" || key.escape;
    },
    canExecute(): boolean {
        return true;
    },
    execute(context: HotkeyContext): void {
        Log.log('ActionSelector got exit hotkey');
        context.app.exit();
        process.exit(0);
    }
}
const updateHandler: Hotkey<HotkeyContext> = {
    description: "Update",
    hotkey: "F5/Ctrl+R",
    activate(context: HotkeyContext, input: string, key: Key): boolean {
        return (input === 'r' && key.ctrl) || input === '[15~';
    },
    canExecute(context: HotkeyContext): boolean {
        return donePhases.includes(context.phase);
    },
    execute(context: HotkeyContext): void {
        context.reload();
    }
};

const openHandler: Hotkey<HotkeyContext> = {
    description: "Open pull request",
    hotkey: "F4/Enter",
    activate(context: HotkeyContext, input: string, key: Key): boolean {
        return key.return || input === 'OS';
    },
    canExecute(context: HotkeyContext): boolean {
        return donePhases.includes(context.phase) && context.pullRequest !== undefined;
    },
    execute(context: HotkeyContext): void {
        open(context.pullRequest?.url ?? "https://github.com");
    }
};

interface FnButtonProps {
    hotkey: string;
    text: string;
    enabled: boolean;
}
function FnButton(props: FnButtonProps) {
    return (
        <Box marginRight={4}>
            <Text strikethrough={!props.enabled}>{props.hotkey} {props.text}</Text>
        </Box>
    );
}

interface Props {
    phase: Phase;
    selectedPullRequest?: PrioritizedPullRequest | undefined;
    reload(): void;
}

const hotkeys: Array<Hotkey<HotkeyContext>> = [openHandler, updateHandler, exitHandler];
function ActionSelector(props: Props) {
    const app = useApp();
    const context = {pullRequest: props.selectedPullRequest, app, reload: props.reload, phase: props.phase };
    useHotkeys(context, hotkeys);
    const elements = hotkeys.map((hotkey) => (
        <FnButton
            key={hotkey.hotkey}
            hotkey={hotkey.hotkey}
            text={hotkey.description}
            enabled={hotkey.canExecute(context)}
        />
    ));

    return (
        <Box marginLeft={1} marginRight={1}>
            {elements}
        </Box>
    );
}

export default ActionSelector;