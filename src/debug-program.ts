import {AsyncConnectionFactory} from "./server/async-loading/async-controller";
import {ClientSentEvents, writeClientMessage} from "./common/ws-message-formats";
import {Backbone, Renderer} from "./index";

export const debugProgram: Renderer = async (backbone: Backbone) => {
    console.log('Started debug program....')
    console.log('-------------------------')
    console.log();
    const connectionFactory = await backbone();
    const connection = connectionFactory.connect();
    connection.on('message', (data) => {
        console.log('debug', data);
    });
    connection.on('open', () => {
        connection.send(writeClientMessage({ type: ClientSentEvents.LOAD_DATA }));
    });

};