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
    var self = this;
    async.waterfall([
        function getExclude(next) {
            if (self.config.exclude) {
                self.get(self.config.exclude, function(err, values) {
                    log.debug("found "+values.length+" ASINs to exclude");
                    next(null, values);
                });
            } else {
                next(null, []);
            }
        },
        function getBooks(exclude, next) {
            var byUrl = {};
            async.forEach(self.config.urls, function(url, forEachCallback) {
                request(url, function(err, response, body) {
                    if (err) throw err;
                    var $ = cheerio.load(body);
                    // get books
                    $(".s-result-item").each(function() {
                        var asin = $(this).attr("data-asin");
                        var item = $(this).find(".s-access-detail-page");
                        var title = $(item).attr("title");
                        var author = $(this).find(".a-row .a-row a").eq(2).text();
                        var url = $(item).attr("href");
                        //log.debug("exclude "+url+"="+_.includes(exclude, url));
                        if (!_.includes(exclude, asin)) {
                            byUrl[url] = {
                                asin: asin,
                                title: title,
                                author: author,
                                url: url
                            };
                        }
                    });
                    forEachCallback();
                });
            }, function(err) {
                next(err, byUrl);
            });
        },
        function getDetails(byUrl, next) {
            var books = [];
            var i = 0;
            var total= _.keys(byUrl).length;
            log.info("found "+total+" books");
            async.forEach(_.keys(byUrl), function(url, forEachCallback) {
                // get synopsis from detail page link
                request(url, function(err, response, body) {
                    if (err) throw err;
                    var $ = cheerio.load(body);
                    var book = byUrl[url];
                    book.url = $("link[rel='canonical']").attr("href");
                    book.description = $("#bookDescription_feature_div noscript").text().trim();
                    if (book.description.length > 500) {
                        book.description = book.description.substring(0, 500)+"...";
                    }
                    var tag = $("meta[name='title']").attr("content");
                    tag = tag.replace("Amazon.com: ", "");
                    tag = tag.replace(": Kindle Store", "");
                    book.tag = tag;
                    book.source = self.config.id;
                    // TODO: author?
                    books.push(book);
                    i++;
                    if (i%10 === 0) {
                        log.debug("loaded "+i+"/"+total+" book pages");
                    }
                    forEachCallback();
                });
            }, function(err) {
                next(err, books);
            });
        }
    ], function(err, books) {
        self.save(books, callback);
    });
};
