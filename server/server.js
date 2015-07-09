var CronJob = require("cron").CronJob,
    megapisUtil = require("./util"),
    async = require("async"),
    _ = require("lodash"),
    jf = require("jsonfile"),
    moment = require("moment"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-server"),
    argv = require("minimist")(process.argv.slice(2));

var configFile = argv.c || "config/global.json";
var config = megapisUtil.loadGlobalConfig(configFile);
var requiredConfigKeys = ["workers", "redis.port", "redis.host"];

// validate global config
_.each(["workers", "schedule", "redis.port", "redis.host"], function(key) {
    try {
        key.split(".").reduce(function(o, x) { return o[x]; }, config);
    } catch(err) {
        log.error("\nmissing required config key "+key);
        process.exit(1);
    }
});

// validate workers
_.each(_.keys(config.workers), function(key) {
    log.debug("validating ", key);
    config.workers[key].id = key;
    var workerObj = config.workers[key];
    var worker = megapisUtil.makeWorker(workerObj);
    if (!worker.validateConfig()) {
        process.exit(1);
    }
});

_.each(_.keys(config.schedule), function(timeSpec) {
    log4js.configure({ 
        appenders: [ 
            { type: "console", layout: { type: "basic" } } 
        ], replaceConsole: true });
    var workerIds = config.schedule[timeSpec];
    log.info("scheduling "+workerIds.join(", ")+" for "+timeSpec);
    var job = new CronJob(timeSpec, function() {
        log.debug("starting "+workerIds);
        async.forEachSeries(workerIds, 
            function(workerId, callback) {
                megapisUtil.runWorker(config.workers[workerId], callback);
            },
            function(err) {
                if (err) {
                    log.error(err);
                }
                log.debug("done "+workerIds);
            });
    }, null, true);
});
log.info("scheduled "+_.keys(config.schedule).length+" jobs");
