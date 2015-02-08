var log4js = require('log4js'),
    log = log4js.getLogger('megapis-server'),
    _ = require("lodash"),
    jf = require("jsonfile"),
    globalConfig = {};

module.exports.loadGlobalConfig = function(filename) {
    globalConfig = jf.readFileSync(filename, "utf-8");
    return globalConfig;
};

function getKey(config, key) {
    try {
        return key.split(".").reduce(function(o, x) { return o[x]; }, config);
    } catch(err) {
        return null;
    }
}

function validateConfig(config, requiredKeys) {
    var ok = true;
    _.each(requiredKeys, function(key) {
        if (!getKey(config, key)) {
            log.error("missing required config key "+key);
            ok = false;
        }
    });
    return ok;
}

module.exports.validateConfig = validateConfig;

function getWorkerConfig(workerConfigFilename) {
    var workerConfig = {};
    if (workerConfigFilename) {
        workerConfig = _.assign(globalConfig, jf.readFileSync(workerConfigFilename, "utf-8"));
    } else {
        workerConfig = globalConfig;
    }
    return workerConfig;
}

module.exports.getWorkerConfig = getWorkerConfig;

module.exports.runWorker = function(worker) {
    log.info("running worker "+worker.name+" with config "+worker.config);
    workerConfig = getWorkerConfig(worker.config);
    log.info("config=", workerConfig);
    var w = require(worker.module);
    if (w.requiredConfigKeys && !validateConfig(workerConfig, w.requiredConfigKeys)) {
        return;
    }
    w.run(workerConfig);
};

