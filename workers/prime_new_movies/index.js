var log4js = require("log4js"),
    log = log4js.getLogger("megapis-prime-new-movies"),
    request = require("request"), 
    cheerio = require("cheerio"), 
    _ = require("lodash"),
    async = require("async"),
    xray = require("x-ray"),
    _ = require("underscore"),
    util = require("util");

//require("request-debug")(request);

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

function getMovieDetails(movies, key, callback) {
/*
    http://www.omdbapi.com/?t=An+Unfinished+Life&y=&plot=full&r=json

    {"Title":"An Unfinished Life","Year":"2005","Rated":"PG-13","Released":"16 Sep 2005","Runtime":"108 min","Genre":"Drama","Director":"Lasse Hallström","Writer":"Mark Spragg, Virginia Korus Spragg","Actors":"Robert Redford, Jennifer Lopez, Morgan Freeman, Josh Lucas","Plot":"A down on her luck woman, desperate to provide care for her daughter, moves in with her father in-law from whom she is estranged. Through time, they learn to forgive each other and heal old wounds.","Language":"English","Country":"USA, Germany","Awards":"2 wins.","Poster":"http://ia.media-imdb.com/images/M/MV5BMjc3MzE
 */
    var movie = movies[key];
    //log.debug("get ", movie.title);
    var url = "http://www.omdbapi.com/?y=&plot=full&r=json&t="+encodeURIComponent(movie.title);
    request(url, function(err, response, body) {
        if (!err) {
            movies[key] = _.extend(movie, JSON.parse(body));
        }
        callback(null, movies);
    });
}

PrimeMoviesWorker.prototype.run = function(callback) {
    log4js.configure({ appenders: [ { type: "console", layout: { type: "basic" } } ], replaceConsole: true });
    var byId = {};
    var self = this;
    var movies = {};
    var minYear = this.config.minYear || 0;
    async.waterfall([
        function loadMovieList(next) {
            async.each(self.config.urls, function(url, forEachCallback) {
                xray(url)
                    .select([{
                    $root: ".s-result-item",
                    link: "a.s-access-detail-page[href]",
                    thumb: "img.s-access-image[src]",
                    asin: "[data-asin]",
                    title: "a.s-access-detail-page[title]"
                }])
                .run(function(err, array) {
                    log.debug("found ", array.length+" movies on "+url);
                    _.forEach(array, function(movie) {
                        // remove extra notes in title because it confuses search
                        movie.title = movie.title.replace(/\s+\(.*?\)/g, '');
                        movies[movie.asin] = movie;
                    });
                    forEachCallback();
                });
            }, function(err) {
                next(null, movies);
            });
        },
        function loadDetails(movies, next) {
            log.debug("found "+_.keys(movies).length+" movies");
            async.each(_.keys(movies), function(key, forEachCallback) {
                getMovieDetails(movies, key, forEachCallback);
            }, function(err) {
                next(null, movies);
            });
        },
    ], function(err, movies) {
        var list = _.filter(_.values(movies), function(movie) {
            var keep = (!movie.Year || parseInt(movie.Year) >= minYear);
            log.debug((keep ? "keep " : "skip ")+movie.title+" - "+movie.Year);
            return keep;
        });
        log.debug("found "+list.length+" movies since "+minYear);
        self.saveAndForward(list, callback);
    });
};
