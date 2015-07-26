var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    AWS = require("aws-sdk"),
    async = require("async"),
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
    return ["queueUrl", "output", "region"];
};

function deleteMessages(sqs, queueUrl, receipts, callback) {
    var params = {
        QueueUrl: queueUrl,
    };
    var deleted = 0;
    async.eachSeries(receipts, function(item, forEachCallback) {
        params.ReceiptHandle = item;
        sqs.deleteMessage(params, function(err, data) {
            if (err) {
                log.error("error deleting message", err);
            } else {
                deleted += 1;
            }
            forEachCallback();
        });
    }, function(err) {
        log.debug("deleted "+deleted+" messages");
        callback(err);
    });
}

Worker.prototype.run = function(callback) {
    var sqs = new AWS.SQS({region: this.config.region});
    var params = {
        QueueUrl: this.config.queueUrl,
        MaxNumberOfMessages: 10
    };
    var messages = [];
    var receipts = [];
    var received = 0;
    var zeroCount = 0;
    var self = this;
    var totalReceived = 0;
    async.doWhilst(
        function(whilstCallback) {
            sqs.receiveMessage(params, function(err, data) {
                if (err) {
                    log.error("error receiving messages: ", err);
                    zeroCount += 1;
                } else if (data.Messages) { 
                    data.Messages.forEach(function(message) {
                        receipts.push(message.ReceiptHandle);
                        messages.push(message.Body);
                    });
                }
                received = data.Messages ? data.Messages.length : 0;
                totalReceived += received;
                whilstCallback();
            });
        },
        function() { 
            return received > 0 && zeroCount < 3; 
        },
        function(err) {
            log.debug("received "+totalReceived+" messages");
            self.save(messages, function() {
                deleteMessages(sqs, params.QueueUrl, receipts, callback);
            });
        }
    );
};
