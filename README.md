
## What
Megapis is a node.js server application that runs workers.  A worker is an npm module,
and can do anything you can write: fetch data, send email, etc.   It includes a utility
module for workers to read and write data to a Redis backend.

## Why
here's lots of data out there, but it's often not in a format you can use.
Megapis is a framework to help get the info you want, how you want it.
I tried [IFTTT](https://ifttt.com/), but found it too limited -- can only get 
content from their list of sources (including RSS but not web pages).
I tried [Huginn](https://github.com/cantino/huginn), but the abstraction didn't
seem quite right -- it's hard to express logic in JSON.  What I really wanted was an easy
way to take advantage of the vast resources just an `npm install` away.

## Who
Megapis is for someone who wants fine-grained control over what info to get, how to
process it, and what to do with it.  There is no user interface; you'll need to install and
run servers, and write workers in JavaScript.

This repository contains:

[server](server/README.md) - runs workers described by `global.config`

[worker\_util](worker\_util/README.me) - utilities for workers to load, save, and compare values

[workers](workers) - sample workers

## Run a Megapis server

see [running a server](server/README.id)

## Writing a Megapis worker

A Megapis worker is a just a node module that exports a `run` method and (optionally)
a `requiredConfigKeys` array.  Require `megapis-worker-util` for functions that make
it easier to work with the Redis persistence store.  

Before running the worker, the server merges its global 
config with the worker config, and passes the config to the worker's run method.

To bootstrap a worker with all the files it needs:

Set environment variables:

`MEGAPIS_GIT_URL` - repository URL for use in worker's `package.json`
`MEGAPIS_AUTHOR` - author name for use in worker's `package.json`

From `megapis/worker_util`, run `new_Worker.js *worker_name* *worker_path*.  This
will generate a set of files in `worker_path/worker_name` and runs 
`npm install` to get dependencies.  The files are:

- `index.js` - code to get information and save it to the store
- `package.json` - starter file with `log4js` and `megapis-worker-util` dependencies
- `README.md` - describe your worker
- `sample_config.json` - sample configuration file

To have the Megapis server run your module without publishing it, use `npm link` to make it 
available to your server:

    npm-link
    cd ../*server-directory*
    npm link *worker-name*

In `index.js`:

Specify required configuration keys:

    module.exports.requiredConfigKeys = ["location", "storageKeys.self", "storageKeys.output"];

Create a `run` method that gets a configration object:

    module.exports.run = function(config) {
        ... do something ...

Connect to store and config values `redis.port`, `redis.host`, and `redis.options`:

    var client = workerUtil.store.createClient(config);

Save results with key `storageKeys.self` in config, and back up previously saved value:

    var tidesKey = config.storageKeys.self;
    client.save(tidesKey, tides);

Get values that weren't seen in the previous run, save to `storageKeys.output`, and close
connection:

    client.getDiffJson(tidesKey, function(err, unseen) {
        if (unseen && unseen.length > 0) {
            client.add(config.storageKeys.output, unseen, 'Low tide');
        }
        client.quit();
    });

### Testing a worker

Use `megapis/server/run-worker.js` to run a single worker.

First, set up your worker:

Add the worker to the `workers` array in `server/config/global.json`.  For example,

    "workers": [
        {
            "id": "low_tide",
            "name": "Half Moon Bay Low Tide",
            "schedule": "29 19 * * *",
            "module": "megapis-low-tide",
            "config": "config/half_moon_bay.json"
        },
    ]

Copy the worker's `sample_config.json` to the location in the `config` key, and 
edit as needed.

Run the worker with `run_worker.js *worker_id*`.  For example,

    ./run_worker.js low_tide



