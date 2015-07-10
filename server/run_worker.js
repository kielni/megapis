#!/usr/bin/env node

var megapisUtil = require("./util"),
    _ = require("lodash"),
    CronJob = require("cron").CronJob,  
    jf = require("jsonfile"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-server");

/*
    run a single worker by id
*/
var config = megapisUtil.loadGlobalConfig("config/global.json");
var id = process.argv[2];
var workerObj = config.workers[id];
if (!workerObj) {
    log.error("can't find worker "+id);
    process.exit(1);
}
workerObj.id = id;
log.info("running "+id);
megapisUtil.runWorker(workerObj, function(err, result) {
    if (err) {
        log.error(err);
    }
    log.info("done "+workerObj.id);
});

