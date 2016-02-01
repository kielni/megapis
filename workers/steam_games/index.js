var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    _ = require("lodash"),
    async = require("async"),
    moment = require("moment"),
    Xray = require("x-ray"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

var baseUrl, minDate, maxDate, latestDate, games, page;

function Worker(config) {
    Worker.super_.call(this, config);
}
 
util.inherits(Worker, MegapisWorker);

exports.createWorker = function(config) {
    return new Worker(config);
};

Worker.prototype.getConfigKeys = function() {
    // optional: minAge (default 0), maxAge (default none)
    return ["url", "output"];
};

var loadPage = function(url, callback) {
    var x = Xray();
    console.log("loading "+url);
    x(url, "a.search_result_row", [{
        url: "@href",
        thumb: "img@src",
        date: ".search_released",  // Jan 22, 2016
        title: ".title",
        reviews: ".search_review_summary[data-store-tooltip]"
    }])(function(err, array) {
        //log.debug("results=", JSON.stringify(array));
        console.log(array.length+" results");
        _.forEach(array, function(game) {
            console.log(game.title+"\t"+game.date/*+"\t"+game.url*/);
            try {
                var dt = moment(game.date, "MMM D, YYYY");
                latestDate = dt;
                if (dt > maxDate || dt < minDate) {
                    console.log("\t"+game.date+" outside range "+minDate.format("MMM DD, YYYY")+
                        " - "+maxDate.format("MMM DD, YYYY"));
                    return;
                }
            } catch(e) {
                console.warn("error parsing "+game.date, e);
            }
            console.log("* adding game "+game.title);
            games.push(game);
        });
        callback();
    });
};

Worker.prototype.run = function(callback) {
    var self = this;
    baseUrl = this.config.url;
    maxDate = moment();
    maxDate.subtract(this.config.minAge ? this.config.minAge : 0, "days");
    minDate = moment();
    minDate.subtract(this.config.maxAge ? this.config.maxAge : 9999, "days");
    latestDate = moment();
    games = [];
    page = 1;
    async.waterfall([
        function getGames(next) {
            console.log("start getGames");
            async.whilst(
                function() {
                    console.log("minDate="+minDate.format("MMM DD YY")+" latestDate="+latestDate.format("MMM DD, YYYY"));
                    return latestDate > minDate;
                },
                function(callback) {  // get page
                    console.log("load page "+page);
                    loadPage(baseUrl+"&page="+page, function() {
                        page += 1;
                        callback();
                    });
                },
                function() {
                    console.log("whilst.3");
                    next();
                }
            );
        },
        function getDetails(next) {
            console.log("\n\n"+games.length+" games");
            var x = Xray();
            async.forEachSeries(games, function(game, forEachCallback) {
                console.log(game.title+"\t"+game.url);
                x(game.url, {
                    title: ".apphub_AppName",
                    players: ".game_area_details_specs",
                    genres: [".details_block a"],
                    description: "#game_area_description",
                    reviews: ".release_date",
                    positive: "#ReviewsTab_positive",
                    negative: "#ReviewsTab_negative",
                    tags: [".glance_tags .app_tag"],
                    img: ".game_header_image_full@src",
                    features: [".game_area_details_specs"],
                    birthdate: "#agegate_box"
                })(function(err, meta) {
                    if (err) {
                        console.error("err=", err);
                    }
                    //console.log("meta=", meta);
                    if (meta && meta.birthdate) {
                        console.log("\tskipping birth date required");
                        forEachCallback();
                        return;
                    }
                    if (meta) {
                        _.extend(game, meta);
                    }
                    ["positive", "negative", "reviews", "description"].forEach(function(field) {
                        if (game[field]) {
                            game[field] = game[field].trim().replace(/\s+/g, " ");
                        }
                    });
                    ["genres", "tags", "features"].forEach(function (field) {
                        if (game[field]) {
                            game[field] = game[field].map(function(val) {
                                return val.trim();
                            }).join(", ");
                        }
                    });
                    //console.log(game);
                    console.log("\t"+game.date+"\t"+game.reviews);
                    forEachCallback();
                });
            }, function() {
                console.log("next 137");
                next();
            });
        },
    ], function(err) {
        console.log("got ", games.length);
        self.saveAndForward(games, callback);
    });
};
