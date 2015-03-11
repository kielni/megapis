var store = require("./store"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker-util"),
    _ = require("lodash");

module.exports.store = store;

module.exports.getWorkerName = function(config, workerId) {
    var name = workerId;
    var worker = _.find(config.workers, function(w) {
        return w.id === workerId;
    });
    if (worker) {
        name = worker.name;
    }
    return name;
};

/*
    save a key, get differences from previous version, and forward to another key
*/
module.exports.saveAndForward = function(config, values) {
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