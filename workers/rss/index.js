var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    FeedParser = require("feedparser"),
    async = require("async"),
    request = require("request"),
    moment = require("moment"),
    feedUtils = require("feedparser/utils"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function RssWorker(config) {
    RssWorker.super_.call(this, config);
}
 
util.inherits(RssWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new RssWorker(config);
};

RssWorker.prototype.getConfigKeys = function() {
    return ["output", "urls"];
};

function fetchRss(config, callback) {
    var data = [];
    var maxItems = 0; // all
    if (config.maxItemsPerFeed) {
        maxItems = parseInt(config.maxItemsPerFeed);
    }
    var minDate = moment();
    if (config.maxDaysOld) {
        minDate.subtract(config.maxDaysOld, "days");
    } else {
        minDate.subtract(100, "years");
    }
    async.forEachSeries(config.urls,
        function(url, forEachCallback) {
            log.debug("get ", url);
            var meta = {};
            var items = [];
            var feedparser = new FeedParser();
            var req = request(url);
            req.on("error", function(error) {
                log.error("error loading "+url+": ", error);
            });
            req.on("response", function (res) {
                var stream = this;
                if (res.statusCode != 200) return this.emit("error", new Error("Bad status code"));
                stream.pipe(feedparser);
            });
            feedparser.on("error", function(error) {
                log.error("error parsing feed: ", error);
                forEachCallback();
            });
            feedparser.on("readable", function() {
                var stream = this;
                meta = this.meta;
                var item = stream.read();
                while (item) {
                    var dt = moment(item.pubdate);
                    var read = config.excludeUrls && config.excludeUrls.indexOf(item.link) >= 0;
                    log.debug("url="+item.link+" read="+read);
                    if (!read && dt.isAfter(minDate)) {
                        items.push({
                            title: item.title,
                            summary: feedUtils.stripHtml(item.summary),
                            url: item.link,
                            guid: item.guid,
                            image: item.image,
                            pubdate: item.pubdate,
                        });
                    }
                    item = stream.read();
                }
            });
            feedparser.on("end", function() {
                log.debug("done with "+url+"; "+items.length+" items");
                if (items.length) {
                    if (maxItems) {
                        items = items.slice(0, maxItems);
                    }
                    data.push({
                        title: meta.title,
                        url: meta.link,
                        items: items
                    });
                }
                forEachCallback();
            });
        }, function(err) {
            if (err) {
                log.error("error ", err);
            } else {
                log.debug("done "+Object.keys(data).length+" sources");
            }
            callback(err, data);
        });
}

RssWorker.prototype.run = function(callback) {
    var self = this;
    this.config.excludeUrls = [];
    if (this.config.excludeKey) {
        this.get(this.config.excludeKey, function(err, values) {
            self.config.excludeUrls = values;
            fetchRss(self.config, function(err, data) {
                if (!err) {
                    self.save(data);
                }
            });
        });
    } else {
        fetchRss(this.config, function(err, data) {
            if (!err) {
                self.save(data, callback);
            }
        });
    }
};
