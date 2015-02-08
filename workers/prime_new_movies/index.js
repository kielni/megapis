var log4js = require("log4js"),
    log = log4js.getLogger("megapis-prime-new-movies"),
    workerUtil = require("megapis-worker-util"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    _ = require("lodash"),
    async = require("async");

module.exports.requiredConfigKeys = ["urls", "storageKeys.self", "storageKeys.output"];

module.exports.run = function(config) {
    var byId = {};
    var movies = [];
    async.forEach(config.urls, function(url, callback) {
        request(url, function(err, response, body) {
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
        log.info("got "+_.keys(byId).length+" movies");
        async.forEach(_.values(byId), function(movie, callback) {
            // get synopsis from detail pageink
            request(movie.url, function(err, response, body) {
                if (err) throw err;
                var $ = cheerio.load(body);
                var url = $("meta[property='og:url']").attr("content");
                // get id from url
                var id = url.match(/product\/(.*?)\//)[1];
                // remove request param on end
                var re = new RegExp("(.*?/"+id+")/.*");
                url = url.match(re)[1];
                var m = byId[id];
                m.url = url;
                m.img = $("meta[property='og:image']").attr("content");
                m.description = $("meta[property='og:description']").attr("content");
                m.rating = $("meta[property='og:rating']").attr("content");
                m.ratingCount = $("meta[property='og:rating_count']").attr("content");
                movies.push(m);
                //log.info("m=",m);
                callback();
            });
        }, function(err) {
            workerUtil.saveAndForward(config, movies, config.storageKeys.self,
                config.storageKeys.output, 'Prime new movies');

        });
    });
};
