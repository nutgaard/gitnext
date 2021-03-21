import {Key, useInput} from "ink";
import {useState} from "react";

export interface Hotkey<CONTEXT> {
    hotkey: string;
    description: string;
    activate(context: CONTEXT, input: string, key: Key): boolean;
    execute(context: CONTEXT): void;
    canExecute(context: CONTEXT): boolean;
}

function buildInputHandler<T>(
    context: T,
    hotkeys: Array<Hotkey<T>>,
    setDebugValue: (value: Hotkey<T> | undefined) => void
):  (input: string, key: Key) => void {
    return (input: string, key: Key) => {
        const handler = hotkeys.find((hotkey) => hotkey.activate(context, input, key));
        if (handler && handler.canExecute(context)) {
            setDebugValue(handler);
            handler.execute(context);
        } else {
            setDebugValue(undefined);
        }
    }
}

export function useHotkeys<T>(context: T, hotkeys: Array<Hotkey<T>>): Hotkey<T> | undefined {
    const [debugValue, setDebugValue] = useState<Hotkey<T> | undefined>(undefined)
    const handler = buildInputHandler(context, hotkeys, setDebugValue);
    useInput(handler);
    return debugValue;
}