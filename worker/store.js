var redis = require("redis"),
    _ = require("lodash"),
    jf = require("jsonfile"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker-store"),
    client;

/*
    simple wrapper for RedisClient that provides methods to persist worker state
    as lists of JSON objects
*/

var defaults =  {
    "redis": {
        "port": 6379,
        "host": "localhost",
        "redisOptions": {}
    }
};

function WorkerStorage() {
}

exports.WorkerStorage = WorkerStorage;

exports.createClient = function(config) {
    client = redis.createClient(config.redis.port, config.redis.host,
        config.redis.options);
    return this;
};

exports.quit = function() {
    client.quit();
};

function getPreviousKey(key) {
    return key+":previous";
}

/*
    get key and parse into JSON
*/
exports.get = function(key, callback) {
    client.smembers(key, function(err, replies) {
        var values = [];
        if (replies) {
            values = _.map(replies, function(s) {
                return JSON.parse(s);
            });

        }
        callback(err, values);
    });
};

/*
    back up current value of key, then save values as a set
    values is a JSON list
*/
exports.save = function(key, values, callback) {
    client.rename(key, getPreviousKey(key), function(err, replies) {});
    this.add(key, values, callback);
};

/*
    convert each item in JSON list values to a string and add to 
    a set
*/
exports.add = function(key, values, callback) {
    // add each value to set
    var multi = client.multi();
    _.each(values, function(v) {
        //log.debug("adding to key "+key, v);
        multi.sadd(key, JSON.stringify(v));
    });
    multi.exec(function(err, replies) {
        if (replies) {
            log.debug("added ",replies.length+" values to "+key);
        } else {
            log.error(err);
        }
        callback(err, replies);
    });
};

/*
    delete a key
*/
exports.del = function(key, callback) {
    client.del(key, function (err, replies) {});
    client.del(getPreviousKey(key), function (err, replies) {
        callback(err, replies);
    });
};

/*
    get difference between current and previous members of key set as JSON
*/
exports.getDiffJson = function(key, callback) {
    log.debug("get diff: key="+key+" prev="+getPreviousKey(key));
    client.sdiff(key, getPreviousKey(key), function(err, replies) {
        var values = [];
        if (replies) {
            log.debug(replies.length+" different values");
            values = _.map(replies, function(s) {
                return JSON.parse(s);
            });
        }
        callback(err, values);
    });
};

