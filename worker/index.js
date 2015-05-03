var store = require("./store"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    _ = require("lodash"),
    util = require("util");

var MegapisWorker = function(config) {
    this.config = config;
};

exports.MegapisWorker = MegapisWorker;

exports.createWorker = function(config) {
    return new MegapisWorker(config);
};

// derived class should override this
MegapisWorker.prototype.run = function() {
    throw "override run method";
};

// derived class should override this if needed
MegapisWorker.prototype.getConfigKeys = function() {
    return [];
};

MegapisWorker.prototype.validateConfig = function() {
    var ok = true;
    var config = this.config;
    _.each(this.getConfigKeys(), function(key) {
        var val = null;
        try {
            val = key.split(".").reduce(function(o, x) { return o[x]; }, config);
        } catch(err) { }
        if (!val) {
            log.error("missing required config key "+key);
            ok = false;
        }
    });
    return ok;
};

MegapisWorker.prototype.save = function(values) {
    var config = this.config;
    var client = store.createClient(config);
    client.add(config.output, values, function(err, replies) {
        client.quit();
    });
};

/*
    save a key, get differences from previous version, and forward to another key
*/
MegapisWorker.prototype.saveAndForward = function(values) {
    var config = this.config;
    var client = store.createClient(config);
    client.save(config.id, values, function(err, replies) {
        log.debug("saved "+values.length+" values to "+config.id);
        client.getDiffJson(config.id, function(err, unseen) {
            log.debug("unseen=", unseen);
            // add source
            _.each(unseen, function(value) {
                value.source = config.id;
            });
            // send to output key
            if (unseen && unseen.length > 0) {
                client.add(config.output, unseen, function(err, replies) {
                    log.debug("done add", err, replies);
                    client.quit();
                });
            } else {
                log.info("no new values");
                client.quit();
            }
        });
    });
};

MegapisWorker.prototype.getAndDelete = function(key, callback) {
    var client = store.createClient(this.config);
    client.get(key, function(err, values) {
        callback(err, values);
        client.del(key, function(err, replies) {
            client.quit();
        });
    });
};

MegapisWorker.prototype.getWorkerName = function(workerId) {
    var name = workerId;
    var worker = _.find(this.config.workers, function(w) {
        return w.id === workerId;
    });
    if (worker) {
        name = worker.name;
    }
    return name;
};

