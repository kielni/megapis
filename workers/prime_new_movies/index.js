var log4js = require("log4js"),
    log = log4js.getLogger("megapis-prime-new-movies"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    _ = require("lodash"),
    async = require("async"),
    xray = require("x-ray"),
    util = require("util");

require('request-debug')(request);

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

function getThumbnail(err, obj) {
    /*
    console.log("found "+array.length+" thumbnails");
    console.log(array);
    */
    console.log("obj=", obj);
}

function getMovieDetails(obj) {
//        xray(url)

}

PrimeMoviesWorker.prototype.run = function() {
    var byId = {};
    var movies = [];
    var self = this;
    async.forEach(self.config.urls, function(url, callback) {
        log.debug("url=", url);
        xray(url)
            //.select([".s-result-item"])
            .select({
                $root: ".s-result-item",
                link: 'a.s-access-detail-page[href]',
                thumb: 'img.s-access-image[src]',
                asin: "[data-asin]",
                title: "a.s-access-detail-page[title]"
            })
            .run(function(err, obj) {
                movies.push(getMovieDetails(obj));
            });
        }, function(err) {
            log.info("done, movies=", movies);
            if (err) {
                log.error("error: ", err);
            }
            self.saveAndForward(movies);
    });
};

PrimeMoviesWorker.prototype.runPrev = function() {
    var byId = {};
    var movies = [];
    var self = this;
    async.forEach(self.config.urls, function(url, callback) {
        var req = {
            url: url,
            headers: {
                "User-Agent": "curl/7.32.0"
            }
        };
        // "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.111 Safari/537.36"
        // get genre pages
        request(req, function(err, response, body) {
            if (err) throw err;
            var $ = cheerio.load(body);
            // get movie thumbnails
            $(".s-result-item").each(function() {
                //console.log("s-result-item=", $(this).html());
                var id = $(this).data("asin");
                var container = $(this).find(".s-item-container");
                var url = $(container).find(".a-row:nth-child(1) a").attr("href");
                // http://www.amazon.com/Anchorman-Legend-Continues-Will-Ferrell/dp/B00HVNZ6Q2/
                var re = new RegExp("(.*/dp/.*?)/.*");
                var match = url.match(re);
                if (match && match.length > 1) {
                    url = match[1];
                }
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
            //console.log("movie "+i+" page="+movie.url);
            request(movie.url, function(err, response, body) {
                if (err) throw err;
                log.info(movie.url+"\n"+body);
                var $ = cheerio.load(body);
                console.log("\n===============\nhtml=", $("*").html());
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
                log.debug(i+" parsed url="+movie.url);
                //log.debug($("html").html());
                // image is in a script
                re = new RegExp(".*?(http://ecx.images-amazon.com/.*?.jpg).*");
                match = body.match(re);
                if (match && match.length > 1) {
                    //m.img = $("meta[property='og:image']").attr("content");
                    m.img = match[1];
                }
                m.description = $("meta[property='og:description']").attr("content");
                m.rating = $("meta[property='og:rating']").attr("content");
                m.ratingCount = $("meta[property='og:rating_count']").attr("content");
                console.log("parsed values=", m);
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
