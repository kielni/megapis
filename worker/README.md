# Megapis worker base

This module is a base for creating Megapis workers.  It provides methods to validate
config, work with the store (save, save and forward to a different key, get and delete
a key), and get a worker name.  

## create worker

Run `node new_worker worker-name worker-path` to generate a new from 
the templates in `blueprints`.  The script will generate an `index.js` file that 
inherits from `megapis-worker` with an empty `run` method; implement the run method
to make the worker do something.

````
var MegapisWorker = require("megapis-worker").MegapisWorker;

function Worker(config) {
    Worker.super_.call(this, config);
}
 
util.inherits(Worker, MegapisWorker);

exports.createWorker = function(config) {
    return new Worker(config);
};

Worker.prototype.run = function() {
    throw "override run method";
}
````

