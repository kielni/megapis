# Megapis server

The Megapis server loads workers from a a config file and runs them via cron.

## Running a Megapis server

### Prerequisites

Install and start a Redis server.  See http://redis.io/topics/quickstart for details.

### Install server

	npm install megapis-server

### Install worker(s)

#### from npm

	npm install <worker-package>

#### from local filesystem

	cd ~/my-worker
	npm link
	cd ~/my-server
	npm link my-worker

### Configure server

	mkdir config

Create a `global.json` file like this:

	{
	    "workers": [
	    {
	        "name": "Worker #1",
	        "schedule": "0 12 * * *",
	        "module": "megapis-worker",
	        "config": "config/my_worker.json"
	    },
	    ... other workers ...
	    ],
	    "redis": {
	        "port": 6379,
	        "host": "localhost",
	        "options": {}
	    },
	    ... other config keys used by multiple workers ...
	}

Each worker entry must contain:

- **name** - string describing the worker
- **schedule** - when to run worker, in crontab format (see https://github.com/ncb000gt/node-cron)
- **module** - package containing the worker code (must be installed)
- **config** - path to worker-specific config file; relative to server directory

### Configure workers

Copy the `sample_config.json` file from the worker directory to the server's config
directory, and edit it as needed.

Example for the [low tide](wokers/low_tide/README.md) worker:

	{
		"location": "Half-Moon-Bay-California",
		"storageKeys": {
			"self": "tides",
			"output": "weeklyEmail"
		}
	}

This config tells the [low tide](wokers/low_tide/README.md) worker to
get tide charts for Half Moon Bay, store the results in the `tides` key,
and also output the results to the `weeklyEmail` key.

### Test and run server

Make sure your redis server is running, your server is configured, and your
workers are installed and configured.  Then from your server directory, run

	node test

This will validate your configuration and exit successfully.  Once it 
succeeds, run your server with

	node server


