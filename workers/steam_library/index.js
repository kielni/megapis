var log4js = require('log4js'),
    log = log4js.getLogger('megapis-worker'),
    _ = require('lodash'),
    async = require('async'),
    moment = require('moment'),
    Xray = require('x-ray'),
    rp = require('request-promise-native'),
    RSVP = require('rsvp'),
    util = require('util');

var MegapisWorker = require('megapis-worker').MegapisWorker;

var baseUrl, minDate, maxDate, latestDate, games, page;

function Worker(config) {
    Worker.super_.call(this, config);
}

util.inherits(Worker, MegapisWorker);

exports.createWorker = function(config) {
    return new Worker(config);
};

Worker.prototype.getConfigKeys = function() {
    return ['apiKey', 'steamId', 'libraryUrl', 'output'];
};

Worker.prototype.getGames = function(callback) {
    var self = this;
    var x = Xray();
    var exclude = this.config.exclude || [];
    exclude.push('');
    var promises = [
        rp({
            uri: 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/',
            qs: {
                key: this.config.apiKey,
                steamid: this.config.steamId,
                format: 'json',
                include_appinfo: 1
            },
            json: true
        }),
        rp({
            url: this.config.libraryUrl,
            json: true
        })
    ];
    RSVP.all(promises).then((values) => {
        var owned = values[0].response.games;
        /*
        {
            "appid": 42910,
            "name": "Magicka",
            "playtime_2weeks": 609,
            "playtime_forever": 3268,
            "img_icon_url": "0eb97d0cd644ee08b1339d2160c7a6adf2ea0a65",
            "img_logo_url": "8c59c674ef40f59c3bafde8ff0d59b7994c66477",
            "has_community_visible_stats": true
        },
        */
        var library = [];
        if (values[1] && values[1].data) {
            library = values[1].data;
        }
        var libraryIds = library.map(function(game) { return game.appid});
        var lookup = _.reject(owned, function(game) {
            return libraryIds.indexOf(game.appid) >= 0;
        });
        console.log('library='+libraryIds.length, 'owned='+owned.length+' lookup='+lookup.length);

        var i = 0;
        async.forEachSeries(lookup, function(game, forEachCallback) {
            i += 1;
            console.log(i+'\t'+game.appid+'\t'+game.name);
            game = _.omit(game, ['playtime_2weeks', 'playtime_forever', 'has_community_visible_stats']);
            game.url = 'http://store.steampowered.com/app/'+game.appid+'/';
            x(game.url, {
                title: '.apphub_AppName',
                players: '.game_area_details_specs',
                genres: ['.details_block a'],
                linkbar: ['.details_block .linkbar'],
                description: '#game_area_description',
                positive: '#ReviewsTab_positive',
                negative: '#ReviewsTab_negative',
                tags: ['.glance_tags .app_tag'],
                features: ['.game_area_details_specs'],
                birthdate: '#agegate_box'
            })(function(err, meta) {
                if (err || (meta && meta.birthdate)) {
                    forEachCallback();
                    return;
                }
                if (meta) {
                    _.extend(game, meta);
                }
                ['positive', 'negative', 'reviews', 'description'].forEach(function(field) {
                    if (game[field]) {
                        game[field] = game[field].trim().replace(/\s+/g, ' ');
                    }
                });
                if (game.description) {
                    game.description = game.description.replace('About This Game ', '');
                }
                // genre a tags in first .details_block have no additional class;
                // link a tags in second .details_block have .linkbar
                game.linkbar.forEach(function(link) {
                    game.genres = _.without(game.genres, link);
                });
                delete game.linkbar;
                // + button is styled like a tag
                game.tags = _.without(game.tags, '+');
                ['genres', 'tags', 'features'].forEach(function(field) {
                    if (!game[field]) {
                        return;
                    }
                    game[field] = _.uniq(game[field].map(function(val) {
                        return val.trim();
                    }));
                    if (exclude.length) {
                        _.pullAll(game[field], exclude);
                    }
                });
                //console.log(game);
                library.push(game);
                forEachCallback();
            });
        }, function() {
            console.log('library.length=', library.length);
            self.save(library, callback);
        });
    });
};

Worker.prototype.run = function(callback) {
    try {
        this.getGames(callback);
    } catch(e) {
        console.error('error');
        console.trace();
        callback(e);
    }
};
