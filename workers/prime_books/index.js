var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    _ = require("lodash"),
    async = require("async"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function PrimeBooksWorker(config) {
    PrimeBooksWorker.super_.call(this, config);
}
 
util.inherits(PrimeBooksWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new PrimeBooksWorker(config);
};

PrimeBooksWorker.prototype.getConfigKeys = function() {
    return ["urls", "output"];
};

PrimeBooksWorker.prototype.run = function(callback) {
    var books = [];
    var byUrl = {};
    var self = this;
    async.forEach(this.config.urls, function(url, callback) {
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
        var i = 0;
        var total= _.keys(byUrl).length;
        log.info("found "+total+" books");
        async.forEach(_.keys(byUrl), function(url, callback) {
            // get synopsis from detail page link
            request(url, function(err, response, body) {
                if (err) throw err;
                log.debug("url=", url);
                var $ = cheerio.load(body);
                var book = byUrl[url];
                book.url = $("link[rel='canonical']").attr("href");
                book.description = $("#bookDescription_feature_div noscript").text().trim();
                if (book.description.length > 500) {
                    book.description = book.description.substring(0, 500)+"...";
                }
                log.debug("url="+url+"\n"+book.description+"\n\n");
                var tag = $("meta[name='title']").attr("content");
                tag = tag.replace("Amazon.com: ", "");
                tag = tag.replace(": Kindle Store", "");
                book.tag = tag;
                book.source = self.config.id;
                books.push(book);
                i++;
                if (i%10 === 0) {
                    log.debug("loaded "+i+"/"+total+" book pages");
                }
                callback();
            });
        }, function(err) {
            self.save(books, callback);
        });
    });
};


