import daemon from './daemon';

switch (process.argv[2]) {
    case "start":
        daemon.start();
        break;
    case "stop":
        daemon.stop();
        break;
    case "kill":
        daemon.kill();
        break;
    case "restart":
        daemon.stop(() => daemon.start());
        break;
    case "status":
        const pid = daemon.status();
        if (pid) {
            console.log('Daemon is running. PID:', pid);
        } else {
            console.log('Daemon is not running.')
        }
        break;
    default:
        console.log('Usage: start|stop|kill|restart|status');
}