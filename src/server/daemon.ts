const daemon = require('daemonize2').setup({
    main: 'server.js',
    name: 'gitnext-daemon',
    pidfile: 'gitnext.pid'
});

daemon
    .on("starting", function() {
        console.log("Starting daemon...");
    })
    .on("started", function(pid: string) {
        console.log("Daemon started. PID: " + pid);
    })
    .on("stopping", function() {
        console.log("Stopping daemon...");
    })
    .on("stopped", function() {
        console.log("Daemon stopped.");
    })
    .on("running", function(pid: string) {
        console.log("Daemon already running. PID: " + pid);
    })
    .on("notrunning", function() {
        console.log("Daemon is not running");
    })
    .on("error", function(err: Error) {
        console.log("Daemon failed to start:  " + err.message);
    });


export default daemon;