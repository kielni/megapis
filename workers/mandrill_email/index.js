var mandrill = require("mandrill-api/mandrill"),
    log4js = require("log4js"),
    log = log4js.getLogger("megapis-email"),
    handlebars = require("handlebars"),
    fs = require("fs"),
    _ = require("lodash"),
    workerUtil = require("megapis-worker-util");

module.exports.requiredConfigKeys = ["sourceTemplates.default", "template", "mandrill.apiKey",
    "message" ];

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
        var filename = config.sourceTemplates[source] || config.sourceTemplates.default;
        log.info("loading "+filename+" template for "+source+" messages");
        var template = handlebars.compile(fs.readFileSync(filename, "utf-8"));
        var sourceHtml = "";
        // template should render a single value
        _.each(grouped[source], function(value) {
            sourceHtml += template(value);
        });
        html.push({"source": source, "html": sourceHtml });
    });
    if (html.length === 0) {
        return null;
    }
    var template = handlebars.compile(fs.readFileSync(config.template, "utf-8"));
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

module.exports.run = function(config) {
    var client = workerUtil.store.createClient(config);
    var emailKey = config.storageKeys.self;
    client.get(emailKey, function(err, values) {
        var message = makeMessage(config, values);
        if (message) {
            sendMessage(config, message);
        } else {
            log.info("nothing to send");
        }
        client.del(emailKey, function(err, replies) {
            client.quit();
        });
    });
};