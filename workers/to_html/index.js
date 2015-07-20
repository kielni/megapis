var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    handlebars = require("handlebars"),
    fs = require("fs"),
    moment = require("moment"),
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
    var self = this;
    var config = this.config;
    var filename = "config/"+this.config.id+".hbs";
    var template = handlebars.compile(fs.readFileSync(filename, "utf-8"));
    //this.getAndDelete(config.id, function(err, values) {
    this.get(config.id, function(err, values) {
        log.debug("found "+values.length+" values for "+config.id);
        var html = template({
            "values": values,
            "createdDate": moment().format("ddd M/D h:mm a")
        });
        self.save([html], callback);
    });
};
