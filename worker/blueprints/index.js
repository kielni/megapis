var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function Worker(config) {
    Worker.super_.call(this, config);
}
 
util.inherits(Worker, MegapisWorker);

exports.createWorker = function(config) {
    return new Worker(config);
};

Worker.prototype.getConfigKeys = function() {
    return ["output"];
};

Worker.prototype.run = function(callback) {
    log.debug("do something");
    callback();
};
