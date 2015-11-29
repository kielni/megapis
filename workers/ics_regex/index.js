var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    util = require("util"),
    moment = require("moment"),
    ical = require("ical");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function IcsRegexWorker(config) {
    IcsRegexWorker.super_.call(this, config);
}
 
util.inherits(IcsRegexWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new IcsRegexWorker(config);
};

IcsRegexWorker.prototype.getConfigKeys = function() {
    return ["output", "source", "regexes"];
};

IcsRegexWorker.prototype.run = function(callback) {
    var self = this;
    var regexes = this.config.regexes.map(function(re) {
        return new RegExp(re);
    });
    var exclude = this.config.exclude || false;
    ical.fromURL(this.config.source, {}, function(err, data) {
        var items = [];
        Object.keys(data).forEach(function(key) {
            if (key === "OWNER") {
                return;
            }
            var obj = data[key];
            var dt = moment(obj.start);
            console.log(dt+"\t"+obj.summary);
            var url = obj.url ? obj.url.val : null;
            var matches = [];
            regexes.forEach(function(re) {
                var m = re.exec(obj.summary);
                if (m) {
                    matches.push(m);
                }
            });
            if ((!exclude && matches.length) || (exclude && !matches.length)) {
                items.push({
                    title: obj.summary,
                    link: url,
                    dt: dt.format("MM/DD h:mma"),
                    timestamp: dt.format('X'),
                    match: matches.join(", ")
                });
            }
        });
        items = items.sort(function(a, b) {
            return a.timestamp === b.timestamp ? 0 : a.timestamp < b.timestamp ? -1 : 1;
        });
        self.saveAndForward(items, callback);
    });
};
