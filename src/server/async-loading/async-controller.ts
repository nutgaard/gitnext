import {
    ClientSentEvents,
    readClientMessage,
    ServerSentEvents,
    ServerSentMessages,
    writeServerMessage
} from "../../common/ws-message-formats";
import AsyncLoader from "./async-loader";

export interface AsyncConnectionFactory {
    connect(): AsyncConnection;
}
export interface AsyncConnection {
    send(data: string): void;
    on(event: 'message' | 'open', listener: (data: AsyncData) => void): void;
}
export interface AsyncData {
    toString(): string;
}

class AsyncController<CONNECTION_TYPE extends AsyncConnection, DATA extends AsyncData> {
    private connections: Array<CONNECTION_TYPE> = [];
    private loader: AsyncLoader = new AsyncLoader(this);

    public register(socket: CONNECTION_TYPE) {
        this.connections.push(socket);
        this.loader.syncTo((message) => socket.send(writeServerMessage(message)));
    }
    public unregister(socket: CONNECTION_TYPE) {
        this.connections = this.connections.filter((ws) => ws !== socket);
    }

    public process(socket: CONNECTION_TYPE, data: DATA) {
        console.log('[CONTROLL] process', data);
        try {
            const message = readClientMessage(data);
            switch (message.type) {
                case ClientSentEvents.HELLO: {
                    return socket.send(writeServerMessage({ type: ServerSentEvents.WELCOME }));
                }
                case ClientSentEvents.LOAD_DATA: {
                    return this.loader.load();
                }
            }
        } catch (e: any) {
            if (e instanceof Error) {
                socket.send(writeServerMessage({ type: ServerSentEvents.ERROR, error: e.message }))
            } else {
                socket.send(writeServerMessage({ type: ServerSentEvents.ERROR, error: 'Unknown error: ' + (e.toString()) }))
            }
        }
    }

    public publishMessage(message: ServerSentMessages) {
        const raw = writeServerMessage(message);
        this.connections.forEach((connection) => {
            connection.send(raw);
        });
    }
}

export default AsyncController;