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
log.info("validating global config");
if (!megapisUtil.validateConfig(config, ["workers", "redis.port", "redis.host"])) {
    process.exit(1);
}

// validate each task
var index = 0;
_.each(config.workers, function(worker) {
    // worker must have name, module, schedule, and config
    index += 1;
    if (!hasKey(worker, "name")) {
        process.exit(1);
    }
    log.info("validating worker "+worker.name);
    if (!hasKey(worker, "schedule") || !hasKey(worker, "module") || !hasKey(worker, "config")) {
        process.exit(1);
    }
    // load config file
    var workerConfig = megapisUtil.getWorkerConfig(worker.config);
    // load code
    var w = require(worker.module);
    // validate config
    if (w.requiredConfigKeys && !megapisUtil.validateConfig(workerConfig, w.requiredConfigKeys)) {
        process.exit(1);
    }
    // validate schedule
    try {
        new CronJob(worker.schedule, function() {});
    } catch(ex) {
        log.error("invalid schedule "+worker.schedule, ex);
        process.exit(1);
    }
});
log.info("ok");
process.exit(0);
