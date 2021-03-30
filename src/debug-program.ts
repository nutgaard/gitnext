import {AsyncConnectionFactory} from "./server/async-loading/async-controller";
import {ClientSentEvents, writeClientMessage} from "./common/ws-message-formats";
import {Program} from "./index";

export const debugProgram: Program = async (connectionFactory: AsyncConnectionFactory) => {
    console.log('Started debug program....')
    console.log('-------------------------')
    console.log();
    const connection = connectionFactory.connect();
    connection.on('message', (data) => {
        console.log('debug', data);
    });
    connection.on('open', () => {
        connection.send(writeClientMessage({ type: ClientSentEvents.LOAD_DATA }));
    });

};