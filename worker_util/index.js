var store = require("./store"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker-util"),
    _ = require("lodash");

module.exports.store = store;

/*
    save a key, get differences from previous version, and forward to another key
*/
module.exports.saveAndForward = function(config, values, fromKey, toKey, source) {
    var client = store.createClient(config);
    client.save(fromKey, values, "Low Tide", function(err, replies) {
        client.getDiffJson(fromKey, function(err, unseen) {
            // send to output key
            if (unseen && unseen.length > 0) {
                log.info("sending "+unseen.length+" values to "+toKey+" from "+source);
                client.add(toKey, unseen, source, function(err, replies) {
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