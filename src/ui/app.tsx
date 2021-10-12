import React, {useEffect, useState} from 'react';
import {Box} from 'ink'
import {PrioritizedPullRequest} from "../domain";
import Logo from "./logo";
import useFullscreen, {Context as ScreenSizeContext} from "./fullscreen";
import ActionSelector from "./action-selector";
import Loader from "./loader";
import {Phase} from "./use-async-loader";
import PullRequestListViewer from "./pull-request-list-viewer";
import {AsyncConnectionFactory} from "../server/async-loading/async-controller";
import {useAsyncLoader} from "./use-async-loader";

interface Props {
    connectionFactory: AsyncConnectionFactory;
}

function App(props: Props) {
    const size = useFullscreen();
    const data =useAsyncLoader(props.connectionFactory);
    const [selectedPullRequest, setSelectedPullRequest] = useState<PrioritizedPullRequest | undefined>(undefined);
    const content = data.phase === Phase.DONE && data.data
        ? (
            <PullRequestListViewer
                pullRequests={data.data}
                selectedPullRequest={selectedPullRequest}
                setSelectedPullRequest={setSelectedPullRequest}
            />
        )
        : <Loader {...data} />;

    return (
        <ScreenSizeContext.Provider value={size}>
            <Box flexDirection="column" width={size.columns} height={size.rows}>
                <Logo/>
                {content}
                <ActionSelector
                    selectedPullRequest={selectedPullRequest}
                    reload={data.reload}
                    phase={data.phase}
                />
            </Box>
        </ScreenSizeContext.Provider>
    );
}

export default App;