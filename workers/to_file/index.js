var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    fs = require("fs"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function ToFileWorker(config) {
    ToFileWorker.super_.call(this, config);
}
 
util.inherits(ToFileWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new ToFileWorker(config);
};

ToFileWorker.prototype.getConfigKeys = function() {
    return ["output"];
};

ToFileWorker.prototype.run = function(callback) {
    var config = this.config;
    this.getAndDelete(config.id, function(err, values) {
        // write to output file
        fs.writeFileSync(config.output, values.join("\n"));
        console.log("wrote "+values.length+" to "+config.output);
        callback();
    });
};
