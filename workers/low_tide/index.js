var log4js = require("log4js"),
    log = log4js.getLogger("megapis-low-tide"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function LowTideWorker(config) {
    LowTideWorker.super_.call(this, config);
}
 
util.inherits(LowTideWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new LowTideWorker(config);
};

LowTideWorker.prototype.getConfigKeys = function() {
    return ["location", "output"];
};

LowTideWorker.prototype.run = function(callback) {
    var url = "http://www.tide-forecast.com/locations/"+this.config.location+"/tides/latest";
    var self = this;
    request(url, function(err, reponse, body) {
        // load tide tables and return weekend daytime low tides
        if (err) throw err;
        var $ = cheerio.load(body);
        var lowTides = [];
        // date is only in first row for each day with a rowspan
        var date = "";
        $(".tide-events table tr").each(function(index, tr) {
            // date ~ Monday 19 January
            if ($(tr).find("td.date").length) {
                date = $(tr).find("td.date").text().trim();
            }
            // time ~ 2:19 PM
            var time = $(tr).find("td.time").text().trim();
            // level ~ 0.62 feet
            var level = $(tr).find("td.level .imperial").text().trim();
            // keep negative tides on Sat or Sun between 10am-5pm
            if (level.match(/^-/) && date.match(/^S/) && time.match(/1.:.. A|[1-5]:.. P/)) {
                lowTides.push({
                    "date": date,
                    "time": time,
                    "level": level,
                });
            }
        });
        log.info("found "+lowTides.length+" weekend daytime low tides");
        // send new tide items to output key
        self.saveAndForward(lowTides, callback);
    });
};

