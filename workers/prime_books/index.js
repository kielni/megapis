var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    workerUtil = require("megapis-worker-util"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    _ = require("lodash"),
    async = require("async");

module.exports.requiredConfigKeys = ["urls", "storageKeys.output"];

var books = [];
module.exports.run = function(config) {
    var byUrl = {};
    async.forEach(config.urls, function(url, callback) {
        request(url, function(err, response, body) {
            if (err) throw err;
            var $ = cheerio.load(body);
            // get books
            $(".s-access-detail-page").each(function() {
                var title = $(this).attr("title");
                var url = $(this).attr("href");
                //log.debug("title="+title+" url="+url);
                byUrl[url] = {
                    title: title,
                    url: url
                };
            });
            callback();
        });
    }, function(err) {
        log.info("got "+_.keys(byUrl).length+" books");
        async.forEach(_.keys(byUrl), function(url, callback) {
            // get synopsis from detail page link
            request(url, function(err, response, body) {
                if (err) throw err;
                var $ = cheerio.load(body);
                var book = byUrl[url];
                book.url = $("link[rel='canonical']").attr("href");
                book.description = $(".content").text().trim();
                if (book.description.length > 500) {
                    book.description = book.description.substring(0, 500)+"...";
                }
                var tag = $("meta[name='title']").attr("content");
                tag = tag.replace("Amazon.com: ", "");
                tag = tag.replace(": Kindle Store", "");
                book.tag = tag;
                books.push(book);
                callback();
            });
        }, function(err) {
            var client = workerUtil.store.createClient(config);
            client.add(config.storageKeys.output, books, "Prime books", function(err, replies) {
                log.debug("done add", err, replies);
                client.quit();
            });
        });
    });
};


