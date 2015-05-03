var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    request = require("request"),
    moment = require("moment"),
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
    return ["output"];
};

Worker.prototype.run = function() {
    var self = this;
    request(this.config.url, function(error, response, body) {
        if (error) {
            log.error("error loading url ", error);
            return;
        }
        var events = eval(body);
        var today = moment().format("YYYYMMDD");
        var maxDate = moment().add(10, "days").format("YYYYMMDD");
        var upcoming = [];
        sccgovEventsCalendar.forEach(function(ev) {
            if (ev.eventDate < today || ev.eventDate > maxDate) {
                return;
            }
            var dt = moment(ev.eventDate, "YYYYMMDD");
            upcoming.push({
                date: dt.format("ddd M/D"),
                dt: ev.eventDate,
                url: ev.url,
                description: ev.desc,
                title: ev.eventDescription,
                time: ev.start+' - '+ev.end,
                location: ev.locname
            });
        });
        // sort by date
        upcoming.sort(function(a, b) {
            return a.dt - b.dt;
        });
        console.log(upcoming);
        log.info("found "+upcoming.length+" county parks events");
        self.saveAndForward(upcoming);
    });
};
