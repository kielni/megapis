var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    xray = require("x-ray"),
    moment = require("moment-timezone"),
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
    return ["output", "url"];
};

Worker.prototype.run = function(callback) {
    var self = this;
    // https://github.com/lapwinglabs/x-ray
    /*
<li class=lwe>
            <div class=lwn>
              <span class=lwn0>
                May 5  12:30pm
                
                  - May 26
                
              </span>
              

              <a href="http://events.sjpl.org/event/play_and_learn_together_1841?utm_campaign=widget&utm_medium=widget&utm_source=San+Jose+Library+Events">Play and Learn Together</a>
            </div>
            
            
              <div class=lwd><span class=lwi0><a href="http://events.sjpl.org/event/play_and_learn_together_1841?utm_campaign=widget&utm_medium=widget&utm_source=San+Jose+Library+Events"><img alt="Play and Learn Together" class="lwi" height="50" src="http://images-cf.localist.com/photos/233664/small/95668638e18832433e3b06bb34e437e077b96fef.jpg" title="Play and Learn Together" width="50" /></a></span>Parents with children under the age of 5 years old are invited to play and learn together!  This program is designed to encourage parents to be active partners in their...</div>
            
            
              
                <div class=lwl><span class=lwl0>Location:</span>
                  
                    <a href="http://events.sjpl.org/alum_rock_341?utm_campaign=widget&utm_medium=widget&utm_source=San+Jose+Library+Events">Alum Rock Branch Library</a>
                  
                </div>
              
            

            
            
          </li>
    */
    var events = [];
    var exclude = null;
    if (this.config.excludeRegex) {
        exclude = new RegExp(this.config.excludeRegex, 'i');
    }
    xray(this.config.url)
        .select([{
            $root: "li",
            dateTime: ".lwn0",
            title: "a",
            description: ".lwd",
            branch: ".lwl a"
        }])
        .run(function(err, allEvents) {
            allEvents.forEach(function(ev) {
                if (exclude && (exclude.test(ev.title) || exclude.test(ev.description))) {
                    log.debug("skipping "+ev.title);
                    return;
                }
                ev.dateTime = ev.dateTime.replace(/\s+/g, " ");
                var pattern = ev.dateTime.indexOf(":") >= 0 ? "MMM D h:mma" : "MMM D ha";
                var startDt = moment(ev.dateTime, pattern);
                ev.dateTime = startDt.format("ddd M/D h:mma");
                ev.calendarUrl = self.getCalendarUrl(startDt, moment(startDt).add(1, "hours"),
                    ev.title, ev.description, ev.branch);
                events.push(ev);
            });
            self.saveAndForward(events, callback);
        });
};
