var log4js = require("log4js"),
    log = log4js.getLogger("megapis-mailgun"),
    mg = require("mailgun-js"),
    _ = require("lodash"),
    handlebars = require("handlebars"),
    fs = require("fs"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function MailgunWorker(config) {
    MailgunWorker.super_.call(this, config);
}
 
util.inherits(MailgunWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new MailgunWorker(config);
};

MailgunWorker.prototype.getConfigKeys = function() {
    return ["message", "mailgun.domain", "mailgun.apiKey"];
};

MailgunWorker.prototype.makeMessage = function(values) {
    // group values by source
    var grouped = _.groupBy(values, function(value) {
        if (!value.source) {
            value.source = "default";
        }
        return value.source;
    });
    log.info("found keys ", _.keys(grouped));

    var self = this;
    var html = [];
    // render each set of values with a custom template if available
    _.each(_.keys(grouped), function(source) {
        var filename = "config/"+self.config.id+"_"+source+".hbs";
        log.debug("looking for template "+filename+" for "+source+" messages");
        if (!fs.existsSync(filename)) {
            log.debug("template not found; using default");
            filename = "config/email_default.hbs";
        }
        var template = handlebars.compile(fs.readFileSync(filename, "utf-8"));
        var sourceHtml = "";
        // template should render a single value
        _.each(grouped[source], function(value) {
            sourceHtml += template(value);
        });

        html.push({
            "source": source,
            "name": self.getWorkerName(source),
            "html": sourceHtml.trim() 
        });
        if (self.config.debug) {
            log.debug("source="+source+" name="+self.getWorkerName(source)+
                " html=\n"+sourceHtml.trim()+"-----");
        }
    });
    if (html.length === 0) {
        return null;
    }
    var messageTemplate = "config/"+this.config.id+".hbs";
    log.debug("generating message with "+messageTemplate);
    var template = handlebars.compile(fs.readFileSync(messageTemplate, "utf-8"));
    return template({"sources": html});
};

MailgunWorker.prototype.sendMessage = function(html, callback) {
    // var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
    var mailgun = mg({
        apiKey: this.config.mailgun.apiKey,
        domain: this.config.mailgun.domain
    });
    // message should have subject, from, and to
    var message = this.config.message;
    message.html = html;
    mailgun.messages().send(message, function(err, body) {
        log.info("sent message ", body);
        callback();
    });    
};

MailgunWorker.prototype.run = function(callback) {
    var self = this;
    var config = this.config;
    log.info("getting values for "+config.id);
    this.getAndDelete(config.id, function(err, values) {
        var message = self.makeMessage(values);
        if (message) {
            self.sendMessage(message, callback);
        } else {
            log.info("nothing to send");
            callback();
        }
    });
};
