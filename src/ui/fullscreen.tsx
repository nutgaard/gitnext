import React, {useContext, useEffect, useState} from 'react';
import {Box} from 'ink';

export interface ScreenSize {
    columns: number;
    rows: number;
}
export const Context = React.createContext<ScreenSize>({ columns: 80, rows: 10 })
export function useScreenSize(): ScreenSize {
    return useContext(Context);
}
export default function useFullscreen(): ScreenSize {
    const [size, setSize] = useState<ScreenSize>({
        columns: process.stdout.columns,
        rows: process.stdout.rows
    });
    useEffect(() => {
        function onResize() {
            setSize({
                columns: process.stdout.columns,
                rows: process.stdout.rows,
            });
        }
        process.stdout.on("resize", onResize);
        return () => {
            process.stdout.off("resize", onResize);
        };
    }, []);

    return size;
}