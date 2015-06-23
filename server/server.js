var CronJob = require("cron").CronJob,
    megapisUtil = require("./util"),
    _ = require("lodash"),
    jf = require("jsonfile"),
    moment = require("moment"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-server");
 
/*
  load config/global.json
  for each config.tasks:
      make job with schedule, 
*/
var config = megapisUtil.loadGlobalConfig("config/global.json");
var requiredConfigKeys = ["workers", "redis.port", "redis.host"];

_.each(["workers", "redis.port", "redis.host"], function(key) {
    try {
        key.split(".").reduce(function(o, x) { return o[x]; }, config);
    } catch(err) {
        console.error("\nmissing required config key "+key);
        process.exit(1);
    }
});

_.each(config.workers, function(worker) {
    log.info("scheduling "+worker.name+": "+worker.schedule);
    var job = new CronJob(worker.schedule, function() {
        megapisUtil.runWorker(worker);
    }, null, true);
});
log.info("scheduled "+config.workers.length+" workers");
