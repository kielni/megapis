var log4js = require("log4js"),
    log = log4js.getLogger("megapis-low-tide"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    workerUtil = require("megapis-worker-util");

module.exports.requiredConfigKeys = ["location", "storageKeys.self", "storageKeys.output"];

module.exports.run = function(config) {
    var url = "http://www.tide-forecast.com/locations/"+config.location+"/tides/latest";
    request(url, function(err, reponse, body) {
        // load tide tables and return weekend daytime low tides
        if (err) throw err;
        var $ = cheerio.load(body);
        var lowTides = [];
        $(".tide-events table tr").each(function(index, tr) {
            // date ~ Monday 19 January
            var date = $(tr).find("td.date").text().trim();
            // time ~ 2:19 PM
            var time = $(tr).find("td.time").text().trim();
            // level ~ 0.62 feet
            var level = $(tr).find("td.level .imperial").text().trim();
            // keep negative tides on Sat or Sun between 10am-5pm
            if (level.match(/^-/) && date.match(/^S/) && time.match(/1.:.. A|[1-5]:.. P/)) {
                lowTides.push({
                    "date": date,
                    "time": time,
                    "level": level
                });
            }
        });
        log.info("found "+lowTides.length+" weekend daytime low tides");
        // send new tide items to output key
        workerUtil.saveAndForward(config, lowTides, config.storageKeys.self,
            config.storageKeys.output, "Low tide");
    });
};

