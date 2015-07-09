var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    AWS = require("aws-sdk"),
    async = require("async"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function S3DownloadWorker(config) {
    S3DownloadWorker.super_.call(this, config);
}
 
util.inherits(S3DownloadWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new S3DownloadWorker(config);
};

S3DownloadWorker.prototype.getConfigKeys = function() {
    return ["output", "bucket"];
};

S3DownloadWorker.prototype.postprocessFiles = function(data) {
    return data;
};

S3DownloadWorker.prototype.run = function(callback) {
    var s3 = new AWS.S3();
    var bucket = this.config.bucket;
    var self = this;
    var params = {
        Bucket: bucket
    };
    var transformer = null;
    if (this.config.transformer) {
        transformer = require("./"+this.config.transformer);
    }
    async.waterfall([
        // get keys
        function(callback) {
            log.debug("listObjects ", params);
            s3.listObjects(params, function(err, data) {
                if (err) {
                    log.error("error loading bucket "+bucket, err);
                    callback(err, []);
                } else {
                    var keys = data.Contents.map(function(keyObj) {
                        return keyObj.Key;
                    });
                    callback(null, keys);
                }
            });
        },
        // download keys
        function(keys, callback) {
            var content = {};
            var params = {
                Bucket: bucket
            };
            async.forEachSeries(keys, function(key, forEachCallback) {
                params.Key = key;
                log.debug("getObject ", params);
                s3.getObject(params, function(err, data) {
                    if (err) {
                        // don't want to stop forEach
                        log.error("error getting "+key, err);
                    } else {
                        content[key] = data.Body.toString('utf8');
                    }
                    forEachCallback();
                });
            }, function(err) {
                callback(null, content);
            });
        },
        function(content, callback) {
            log.debug("transform ", transformer);
            var transformed = transformer ? transformer.transform(content) : content;
            callback(null, transformed);
        },
        // save data
        function(content, callback) {
            log.debug("save ", content);
            self.save(content);
        }
    ], function(err, result) {
        log.info("done getting ", bucket);
        callback();
    });
};
