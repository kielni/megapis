var mandrill = require("mandrill-api/mandrill"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-email"),
    handlebars = require("handlebars"),
    fs = require("fs"),
    _ = require("lodash"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function MandrillWorker(config) {
    MandrillWorker.super_.call(this, config);
}
 
util.inherits(MandrillWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new MandrillWorker(config);
};

MandrillWorker.prototype.getConfigKeys = function() {
    return ["message", "mandrill.apiKey"];
};

function makeMessage(config, values) {
    // group values by source
    var grouped = _.groupBy(values, function(value) {
        if (!value.source) {
            value.source = "default";
        }
        return value.source;
    });
    log.info("found keys ", _.keys(grouped));

    var html = [];
    // render each set of values with a custom template if available
    _.each(_.keys(grouped), function(source) {
        var filename = "config/"+config.id+"_"+source+".hbs";
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
            "name": workerUtil.getWorkerName(config, source), // TODO: where does this go?
            "html": sourceHtml.trim() 
        });
    });
    if (html.length === 0) {
        return null;
    }
    var messageTemplate = "config/"+config.id+".hbs";
    log.debug("generating message with "+messageTemplate);
    var template = handlebars.compile(fs.readFileSync(messageTemplate, "utf-8"));
    return template({"sources": html});
}

function sendMessage(config, html) {
    var mandrillClient = new mandrill.Mandrill(config.mandrill.apiKey);
    // message should have subject, from_email, and to
    // see https://mandrillapp.com/api/docs/messages.nodejs.html
    var message = config.message;
    message.html = html;
    var data = {
        "message": message,
        "async": false
    };
    mandrillClient.messages.send(data, function(result) {
        log.info("sent message ", result);
    }, 
    function(e) {
        log.error("A mandrill error occurred: " + e.name + "" - "" + e.message);
    });
}

MandrillWorker.prototype.run = function(config) {
    var client = workerUtil.store.createClient(config);
    log.info("getting values for "+config.id);
    client.get(config.id, function(err, values) {
        var message = makeMessage(config, values);
        if (message) {
            sendMessage(config, message);
        } else {
            log.info("nothing to send");
        }
        client.del(config.id, function(err, replies) {
            client.quit();
        });
    });
};