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

module.exports.runWorker = function(workerObj) {
    var worker = require(workerObj.module).createWorker(getWorkerConfig(workerObj));
    if (!worker.validateConfig()) {
        return;
    }
    worker.run();
};

module.exports.getWorkerName = function(workerId) {
    var name = workerId;
    var worker = _.find(globalConfig.workers, function(w) {
        return w.id === workerId;
    });
    if (worker) {
        name = worker.name;
    }
    return name;
};

