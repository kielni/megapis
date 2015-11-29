var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    FeedParser = require("feedparser"),
    feedUtils = require("feedparser/utils"),
    moment = require("moment"),
    request = require("request"),
    async = require("async"),
    _ = require("lodash"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function RssRegexWorker(config) {
    RssRegexWorker.super_.call(this, config);
}
 
util.inherits(RssRegexWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new RssRegexWorker(config);
};

RssRegexWorker.prototype.getConfigKeys = function() {
    return ["output", "feeds", "regexes"];
};

RssRegexWorker.prototype.run = function(callback) {
    var self = this;
    var items = [];
    var minDate = moment();
    var regexes = this.config.regexes.map(function(re) {
        return new RegExp(re, "im");
    });
    if (this.config.maxHoursOld) {
        minDate.subtract(this.config.maxHoursOld, "hours");
    } else {
        minDate.subtract(100, "years");
    }
    async.forEachSeries(this.config.feeds, function(url, forEachCallback) {
        log.debug("url="+url);
        var req = request(url);
        var feedparser = new FeedParser();
        req.on("error", function(error) {
            log.error("error loading "+url+": ", error);
        });
        req.on("response", function (res) {
            var stream = this;
            if (res.statusCode != 200) return this.emit("error", new Error("Bad status code"));
            stream.pipe(feedparser);
        });
        feedparser.on("error", function(error) {
            log.error("error parsing feed "+url+": ", error);
            forEachCallback();
        });
        feedparser.on("readable", function() {
            var stream = this;
            meta = this.meta;
            var item = stream.read();
            while (item) {
                log.debug(item.title+" dt="+item.pubdate);
                var dt = moment(item.pubdate);
                if (dt.isAfter(minDate)) {
                    var matches = [];
                    _.each(regexes, function(re) {
                        var m = re.exec(feedUtils.stripHtml(item.description));
                        if (m) {
                            matches.push(m);
                        }
                    });
                    if (matches.length) {
                        items.push({
                            title: item.title,
                            link: item.link,
                            summary: feedUtils.stripHtml(item.summary),
                            pubdate: item.pubdate,
                            match: matches.join(", ")
                        });
                    }
                }
                item = stream.read();
            }
        });
        feedparser.on("end", function() {
            log.debug("done with "+url+"; "+items.length+" items");
            forEachCallback();
        });
    }, function(err) {
        if (err) {
            log.error("error ", err);
        } else {
            log.debug("done "+items.length+" items");
        }
        log.debug("items="+JSON.stringify(items));
        self.saveAndForward(items, callback);
    });
};

