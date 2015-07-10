var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    AWS = require("aws-sdk"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function S3UploadWorker(config) {
    S3UploadWorker.super_.call(this, config);
}
 
util.inherits(S3UploadWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new S3UploadWorker(config);
};

S3UploadWorker.prototype.getConfigKeys = function() {
    return ["bucket", "key"];
};

S3UploadWorker.prototype.run = function(callback) {
    var s3 = new AWS.S3();
    var params = {
        Bucket: this.config.bucket,
        Key: this.config.key
    };
    // get input data
    this.getAndDelete(this.config.id, function(err, values) {
        params.Body = JSON.stringify({ "data": values });
        s3.putObject(params, function(err, data) {
            if (err) {
                log.error(err);
                callback(err);
            } else {
                params.ACL = "public-read";
                delete params.Body;
                s3.putObjectAcl(params, function(err, data) {
                    if (err) {
                        log.error("error putting ACL: ", err, err.stack);
                    } else {
                        log.info("uploaded to "+params.Key);
                    }
                    callback();
                });
            }
       });
    });
};
