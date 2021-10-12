import React from "react";
import Spinner from "ink-spinner";
import {Box, Text} from "ink";
import {useScreenSize} from "./fullscreen";
import {error_message} from '../program-utils';
import {Phase} from "./use-async-loader";

function Loader(props: { phase: Phase, error?: Error }) {
    const screenSize = useScreenSize();
    const content = props.error
        ? (
            <>
                <Text color="red">{error_message(props.error)}</Text>
            </>
        )
        : (
            <>
                <Spinner type={"aesthetic" as any}/>
                <Text>{props.phase}</Text>
            </>
        );
    return (
        <Box
            width={screenSize.columns}
            height={screenSize.rows - 30}
            flexGrow={1}
            justifyContent="center"
            alignItems="center"
            flexDirection="column"
        >
            {content}
        </Box>
    );
}

export default Loader;