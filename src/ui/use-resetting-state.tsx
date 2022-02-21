import React, {Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from "react";

export function useResettingState<T>(baseState: T, delayMs: number): [T, Dispatch<SetStateAction<T>>] {
    const base = useRef(baseState);
    const [state, setState] = useState(baseState);
    const [reset, setReset] = useState(0);

    useEffect(() => {
        const id = setTimeout(() => {
            setState(base.current);
        }, delayMs);
        return () => clearTimeout(id);
    }, [base, setState, reset, setReset]);

    const updater: Dispatch<SetStateAction<T>> = useCallback((updateFn: SetStateAction<T>) => {
        setReset(i => i + 1);
        return setState(updateFn);
    }, [setState, setReset]);

    return [state, updater];
}