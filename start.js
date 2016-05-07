'use strict'

const cluster = require('cluster'),
      stopSignals = [
        'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
        'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
      ],
      production = process.env.NODE_ENV == 'production';

let stopping = false;

cluster.on('disconnect', function(worker) {
  if (production) {
    if (!stopping) {
      cluster.fork();
    }
  } else {
    process.exit(1);
  }
});

if (cluster.isMaster) {
  const workerCount = 2; // process.env.NODE_CLUSTER ? Math.max(2, process.env.NODE_CLUSTER) : 2;
  console.log(`Starting ${workerCount} workers...`);
  var collectionWorker = cluster.fork({workerId: 0});
  var workers = [];
  for (let i = 1; i < workerCount; i++) {
    var worker = cluster.fork({workerId: i});
	   worker.on("message", (msg) => { // on message redirect to collection
		     collectionWorker.send(msg);
	   });
     workers.push(worker);
  }
  collectionWorker.on("message", (msg) => {
    workers[msg.workerId-1].send(msg);
  });

  if (production) {
    stopSignals.forEach(function (signal) {
      process.on(signal, function () {
        console.log(`Got ${signal}, stopping workers...`);
        stopping = true;
        cluster.disconnect(function () {
          console.log('All workers stopped, exiting.');
          process.exit(0);
        });
      });
    });
  }
} else {
	if (process.env.workerId == 0) { // collection
		var collection = require("./collection/dataserver");
		process.on("message", collection.handleNewSummoner); // add handler for messages
	} else if (process.env.workerId > 0 && process.argv.indexOf("no-server") === -1) {
		require("./website/server.js");
	}
}
