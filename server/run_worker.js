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
var worker = _.find(config.workers, function(w) {
    return w.id === id;
});
if (!worker) {
    log.error("can't find worker "+id);
    process.exit(1);
}
log.info("running "+id);
// TODO: run with async
megapisUtil.runWorker(worker);

