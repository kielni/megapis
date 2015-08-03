var log4js = require("log4js"),
    log = log4js.getLogger("megapis-server"),
    _ = require("lodash"),
    jf = require("jsonfile"),
    globalConfig = {};

module.exports.loadGlobalConfig = function(filename) {
    globalConfig = jf.readFileSync(filename, "utf-8");
    return globalConfig;
};

function getWorkerConfig(worker) {
    var config = _.assign(globalConfig, jf.readFileSync("config/"+worker.id+".json", "utf-8"));
    config.id = worker.id;
    return config;
}

module.exports.getWorkerConfig = getWorkerConfig;

module.exports.makeWorker = function(workerObj) {
    return require(workerObj.module).createWorker(getWorkerConfig(workerObj));
};

module.exports.runWorker = function(workerObj, callback) {
    try {
        var worker = this.makeWorker(workerObj);
        if (!worker.validateConfig()) {
            callback("error: "+workerObj.name+" invalid config");
            return;
        }
        worker.run(callback);
    } catch(e) {
        log.error("error run worker "+workerObj.id+": ", e);
    }
};

