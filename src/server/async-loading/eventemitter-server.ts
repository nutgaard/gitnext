import EventEmitter from "events";
import AsyncController, {AsyncConnection, AsyncConnectionFactory, AsyncData} from "./async-controller";

enum EventEmitterConnectionMode {
    SERVER= "SERVER", CLIENT = "CLIENT"
}
class EventEmitterConnection implements AsyncConnection {
    private readonly mode: EventEmitterConnectionMode;
    private readonly sendEvent: string;
    private readonly receiveEvent: string;
    private readonly emitter: EventEmitter;

    constructor(
        mode: EventEmitterConnectionMode,
        emitter: EventEmitter
    ) {
        this.mode = mode;
        this.sendEvent = mode === EventEmitterConnectionMode.SERVER ? 'server-data' : 'client-data';
        this.receiveEvent = mode === EventEmitterConnectionMode.SERVER ? 'client-data' : 'server-data';
        this.emitter = emitter;
        this.emitter.on(this.receiveEvent, (data) => {
            console.log(`[${this.mode}] received: ${this.receiveEvent} ${data}`);
        });
    }

    send(data: string): void {
        console.log(`[${this.mode}] sending: ${this.sendEvent} ${data}`);
        this.emitter.emit(this.sendEvent, data);
    }

    on(event: 'message' | 'open', listener: (data: AsyncData) => void): void {
        if (event === 'open') {
            listener('');
        } else {
            this.emitter.on(this.receiveEvent, (data) => {
                listener(data);
            });
        }
    }
}

export async function startEventEmitter(): Promise<AsyncConnectionFactory> {
    const controller = new AsyncController<EventEmitterConnection, AsyncData>();
    const emitter = new EventEmitter();
    const server = new EventEmitterConnection(EventEmitterConnectionMode.SERVER, emitter);
    const client = new EventEmitterConnection(EventEmitterConnectionMode.CLIENT, emitter);

    controller.register(server);
    server.on('message', (data: AsyncData) => {
        controller.process(server, data);
    });

    return {
        connect(): AsyncConnection {
            return client;
        }
    };
}