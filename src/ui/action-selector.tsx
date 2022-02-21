import React from 'react';
import {AppProps, Box, Key, Text, Spacer, useApp} from 'ink';
import open from 'open';
import clipboard from "clipboardy";
import {PrioritizedPullRequest} from "../domain";
import {Hotkey, useHotkeys} from "./use-hotkeys";
import {Phase} from "./use-loader";
import { log } from '../logging';

log("Loading action-selector");

interface HotkeyContext {
    pullRequest: PrioritizedPullRequest | undefined;
    app: AppProps;
    reload(): void;
    phase: Phase;
    setActionHighlight: (tmpValue: string) => void;
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
        context.app.exit();
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

const copyHandler: Hotkey<HotkeyContext> = {
    description: "Copy source branch",
    hotkey:"F6/Ctrl+S",
    activate(context: HotkeyContext, input: string, key: Key): boolean {
        log(`Activition: ${input} ${key}`)
        return (input === 's' && key.ctrl) || input === '[17~';
    },
    canExecute(context: HotkeyContext): boolean {
        return donePhases.includes(context.phase) && context.pullRequest !== undefined;
    },
    execute(context: HotkeyContext) {
        clipboard.writeSync(context.pullRequest?.from ?? 'N/A BRANCH');
        context.setActionHighlight('Copied');
    }
}

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
    actionHighlight: string;
    setActionHighlight: (tmpValue: string) => void
}

const hotkeys: Array<Hotkey<HotkeyContext>> = [openHandler, updateHandler, copyHandler, exitHandler];
function ActionSelector(props: Props) {
    const app = useApp();
    const context = {
        pullRequest: props.selectedPullRequest,
        app, reload:
        props.reload,
        phase: props.phase,
        setActionHighlight: props.setActionHighlight
    };
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
        <Box flexDirection="row">
            <Box marginLeft={1} marginRight={1}>
                {elements}
            </Box>
            <Spacer />
            <Box  marginLeft={1} marginRight={1}>
                <Text>
                    {props.actionHighlight}
                </Text>
            </Box>
        </Box>
    );
}

export default ActionSelector;