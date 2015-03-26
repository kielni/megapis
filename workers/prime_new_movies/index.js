var log4js = require("log4js"),
    log = log4js.getLogger("megapis-prime-new-movies"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    _ = require("lodash"),
    async = require("async"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function PrimeMoviesWorker(config) {
    PrimeMoviesWorker.super_.call(this, config);
}
 
util.inherits(PrimeMoviesWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new PrimeMoviesWorker(config);
};

PrimeMoviesWorker.prototype.getConfigKeys = function() {
    return ["urls", "output"];
};

PrimeMoviesWorker.prototype.run = function(config) {
    var byId = {};
    var movies = [];
    var self = this;
    async.forEach(config.urls, function(url, callback) {
        var req = {
            url: url,
            headers: {
                "User-Agent": "curl/7.32.0",
                "Accept": "*/*"
            }
        };
        // "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.111 Safari/537.36"

        request(req, function(err, response, body) {
            if (err) throw err;
            var $ = cheerio.load(body);
            // get movie thumbnails
            $("li.s-result-item").each(function() {
                var id = $(this).data("asin");
                var container = $(this).find(".s-item-container");
                var url = $(container).find(".a-row:nth-child(1) a").attr("href");
                var shortTitle = $(container).find("a.s-access-detail-page").attr("title");
                byId[id] = {
                    url: url,
                    shortTitle: shortTitle,
                };
            });
            callback();
        });
    }, function(err) {
        var total = _.keys(byId).length;
        var i = 0;
        log.info("got "+total+" movies");
        async.forEach(_.values(byId).slice(0,1), function(movie, callback) {
            // get synopsis from detail page
            request(movie.url, function(err, response, body) {
                if (err) throw err;
                log.info(movie.url+"\n"+body);
                var $ = cheerio.load(body);
                var ogUrl = $("meta[property='og:url']");
                var url, id;
                if (ogUrl && ogUrl.length) {
                    url = ogUrl.attr("content");
                    id = url.match(/product\/(.*?)\//)[1];
                } else {
                    url = $("link[rel='canonical']").attr("href");
                    id = url.match(/dp\/(.*?)$/)[1];
                }
                // remove request param on end
                var re = new RegExp("(.*?/"+id+")/.*");
                var match = url.match(re);
                if (match && match.length > 1) {
                    url = url.match(re)[1];
                }
                var m = byId[id];
                m.url = url;
                /*
                log.debug("head="+$("head").html());
                log.debug("body="+$("body").html());
                */
                log.debug(i+" url="+movie.url);
                //log.debug($("html").html());
                m.img = $("meta[property='og:image']").attr("content");
                m.description = $("meta[property='og:description']").attr("content");
                m.rating = $("meta[property='og:rating']").attr("content");
                m.ratingCount = $("meta[property='og:rating_count']").attr("content");
                movies.push(m);
                i++;
                if (i%10 === 0) {
                    log.debug("loaded "+i+"/"+total+" movie pages");
                }
                callback();
            });
        }, function(err) {
            log.info("done, movies=", movies);
            if (err) {
                log.error("error: ", err);
            }
            self.saveAndForward(movies);
        });
    });
};
