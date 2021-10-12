import * as Log from './logging';
const daemon = require('daemonize2').setup({
    main: 'server.js',
    name: 'gitnext-daemon',
    pidfile: 'gitnext.pid'
});

daemon
    .on("starting", function() {
        Log.log("Starting daemon...");
    })
    .on("started", function(pid: string) {
        Log.log("Daemon started. PID: " + pid);
    })
    .on("stopping", function() {
        Log.log("Stopping daemon...");
    })
    .on("stopped", function() {
        Log.log("Daemon stopped.");
    })
    .on("running", function(pid: string) {
        Log.log("Daemon already running. PID: " + pid);
    })
    .on("notrunning", function() {
        Log.log("Daemon is not running");
    })
    .on("error", function(err: Error) {
        Log.log("Daemon failed to start:  " + err.message);
    });


export default daemon;