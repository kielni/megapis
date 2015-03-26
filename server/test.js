var megapisUtil = require("./util"),
    _ = require("lodash"),
    CronJob = require("cron").CronJob,
    jf = require("jsonfile"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-server");

function hasKey(obj, key) {
    if (!_.has(obj, key)) {
        log.error("missing key "+key);
        return false;
    }
    return true;
}

// validate global config
var config = megapisUtil.loadGlobalConfig("config/global.json");
process.stdout.write("global config ");
var ok = true;
_.each(["workers", "redis.port", "redis.host"], function(key) {
    try {
        key.split(".").reduce(function(o, x) { return o[x]; }, config);
    } catch(err) {
        console.error("\nmissing required config key "+key);
        ok = false;
    }
});
process.stdout.write(" ... ok\n");
if (!ok) {
    process.exit(1);
}
if (config.workers.length < 1) {
    console.error("\nmust have at least 1 worker");
    process.exit(1);
}

// validate each task
var index = 0;
_.each(config.workers, function(workerObj) {
    // worker must have id, name, module, and schedule
    index += 1;
    if (!hasKey(workerObj, "id")) {
        process.exit(1);
    }
    if (!hasKey(workerObj, "name")) {
        process.exit(1);
    }
    process.stdout.write("worker "+workerObj.name+"\n");
    if (!hasKey(workerObj, "schedule") || !hasKey(workerObj, "module")) {
        process.exit(1);
    }
    // load config file
    process.stdout.write("\tconfig "+workerObj.id+".json ");
    var workerConfig = megapisUtil.getWorkerConfig(workerObj);
    // load code
    var worker = require(workerObj.module).createWorker(workerConfig);
    // validate config
    if (!worker.validateConfig()) {
        process.exit(1);
    }
    process.stdout.write(" ... ok\n");
    // validate schedule
    process.stdout.write("\tscchedule "+workerObj.schedule+" ");
    try {
        new CronJob(workerObj.schedule, function() {});
    } catch(ex) {
        console.error("\ninvalid schedule "+workerObj.schedule, ex);
        process.exit(1);
    }
    process.stdout.write(" ... ok\n");
});
process.exit(0);
