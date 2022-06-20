import React, {useState} from 'react';
import {Box} from 'ink'
import version from "./../version";
import {PrioritizedPullRequest} from "../domain";
import Logo from "./logo";
import useFullscreen, {Context as ScreenSizeContext} from "./fullscreen";
import ActionSelector from "./action-selector";
import {LoaderComponent, Phase, useLoader} from "./use-loader";
import PullRequestListViewer from "./pull-request-list-viewer";
import {useResettingState} from "./use-resetting-state";

function App() {
    const size = useFullscreen();
    const data = useLoader()
    const [selectedPullRequest, setSelectedPullRequest] = useState<PrioritizedPullRequest | undefined>(undefined);
    const [actionHighlight, setActionHighlight] = useResettingState(version, 2500);
    const content = data.phase === Phase.DONE && data.data
        ? (
            <PullRequestListViewer
                pullRequests={data.data}
                selectedPullRequest={selectedPullRequest}
                setSelectedPullRequest={setSelectedPullRequest}
            />
        )
        : <LoaderComponent {...data} />;

    return (
        <ScreenSizeContext.Provider value={size}>
            <Box flexDirection="column" width={size.columns} height={size.rows}>
                <Logo/>
                {content}
                <ActionSelector
                    selectedPullRequest={selectedPullRequest}
                    reload={data.reload}
                    phase={data.phase}
                    actionHighlight={actionHighlight}
                    setActionHighlight={setActionHighlight}
                />
            </Box>
        </ScreenSizeContext.Provider>
    );
}

export default App;