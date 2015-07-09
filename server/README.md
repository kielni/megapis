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

    cd ~/my_worker
    npm link
    cd ~/my_server
    npm link my_worker

### Configure server

    mkdir config

Create a `global.json` file with a hash of worker objects, schedule objects, and redis
config details:

    {
        "workers": {
            "workerOne": {
                "name": "Worker #1",
                "module": "megapis-worker"
            },
            ... other workers ...
        },
        "schedule": {
            "0 0 6 * * *": ["workerOne", "workerTwo"]
        }
        "redis": {
            "port": 6379,
            "host": "localhost",
            "options": {}
        },
        ... other config keys used by multiple workers ...
    }

Each worker object is a key/value pair where key is the worker id and value contains

- **name** - string describing the worker
- **module** - package containing the worker code (must be installed)

Each schedule object is a key/value pair where key is a crontab pattern and value
is a list of worker ids to run on the specified schedule.  The workers in each 
schedule entry will be run one after the other.

### Configure workers

Copy the `workerName.json` file from the worker directory to `*worker_id*.json`
in the server's config directory, and edit it as needed.

Example for the [low tide](wokers/low_tide/README.md) worker:

    {
        "location": "Half-Moon-Bay-California",
        "output": "weeklyEmail"
       }
    }

This config tells the [low tide](wokers/low_tide/README.md) worker to
get tide charts for Half Moon Bay and output the results to the `weeklyEmail` key.

### Test and run server

Make sure your redis server is running, your server is configured, and your
workers are installed and configured.  Then from your server directory, run

    node test

This will validate your configuration and exit successfully.  Once it 
succeeds, run your server with

    node server

