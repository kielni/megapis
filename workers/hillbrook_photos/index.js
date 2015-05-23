var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    util = require("util"),
    moment = require("moment"),
    fmt = require("simple-fmt"),
    fs = require("fs"),
    async = require("async"),
    request = require("request");

var MegapisWorker = require("megapis-worker").MegapisWorker;
var photoCount = 0;

function HillbrookWorker(config) {
    HillbrookWorker.super_.call(this, config);
}
 
util.inherits(HillbrookWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new HillbrookWorker(config);
};

HillbrookWorker.prototype.getConfigKeys = function() {
    return ["outputPath", "username", "password", "fromDaysAgo"];
};

var total = 0;

function downloadFile(url, path, callback) {
    var stream = request(url)
        .on("error", function(err) {
            log.error("error downloading "+url+": ", err);
            // don't want to stop for each, so don't send an error
            callback();
        });
    stream.pipe(fs.createWriteStream(path)
            .on("error", function(err) {
                log.error("error piping "+url+": ", err);
                // don't want to stop foreach, so don't send an error
                callback();
                stream.read();
            })
        )
        .on("close", function() {
            //log.debug("downloaded "+url+" to "+path);
            total += 1;
            if (total % 100 === 0) {
                log.info("* "+total);
            }
            callback();
        });
}

function downloadPhotos(outputPath, photos, callback) {
    var total = 0;
    log.info("downloading "+photos.length+" photos");
    // make directories
    photos.forEach(function(photo) {
        var dir = outputPath+"/"+photo.albumKey;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            log.debug("created directory "+dir);
        }
    });
    async.forEach(photos, function(photo, forEachCallback) {
        downloadFile(photo.url, outputPath+"/"+photo.albumKey+"/"+photo.filename,
            forEachCallback);
    }, function(err) {
        if (err) {
            log.error("error downloading ");
        } else {
            log.debug("downloadPhotos: done "+photos.length);
        }
        callback(err, total);
    });
}

function getPhotoList(albumIds, cookieJar, callback) {
    log.info("getting photos from "+albumIds.length+" albums");
    var urlPattern = "https://hillbrook.myschoolapp.com/api/datadirect/GetPhotoAlbum/"+
        "?format=json&albumId={0}&logView=1";
    var photos = [];
    async.forEachSeries(albumIds, function(albumId, forEachCallback) {
        log.debug("getting album "+albumId);
        request({uri: fmt(urlPattern, albumId), jar: cookieJar}, function(err, response, body) {
            var album = JSON.parse(body);
            album.forEach(function(photo) {
                var dt = moment(photo.pri_publish_date, "MM/DD/YYYY HH:mm a");
                var albumKey = dt.format("YYYYMMDD")+"-"+photo.album.replace(/[^\w]/g, "_");
                photos.push({
                    "albumKey": albumKey,
                    "url": "http:"+photo.original_file_path+photo.original_filename,
                    "filename": photo.original_filename.toLowerCase().replace("orig_photo", "")
                });
            });
            forEachCallback();
        });
    }, function(err) {
        if (err) {
            log.error("getPhotoList error", err);
        }
        log.debug("done getPhotoList");
        callback(err, photos);
    });
}

HillbrookWorker.prototype.run = function() {
    var self = this;
    var endDt = moment();
    var startDt = moment().subtract(parseInt(this.config.fromDaysAgo), "days");
    var dateRange = startDt.format("MM/DD/YY")+" to "+endDt.format("MM/DD/YY");
    var cookieJar = request.jar();
    log.info("getting photos: "+dateRange);
    async.waterfall([
        function(callback) {
            // login
            var options = {
                uri: "https://hillbrook.myschoolapp.com/api/SignIn",
                method: "POST",
                json: {
                    From: "",
                    Username: self.config.username,
                    Password: self.config.password,
                    remember: true,
                    InterfaceSource: "WebApp"
                },
                jar: cookieJar
            };
            request(options, callback);
        },
        function(response, body, callback) {
            // get album list
            var urlPattern = "https://hillbrook.myschoolapp.com/api/media/archive?contentId=31&"+
                "startDate={0}&endDate={1}&categories=0_34006&groupTypes=9%2C1%2C3%2C5%2C2";
            var urlDateFormat = "MM[%2F]DD[%2F]YYYY";
            var url = fmt(urlPattern, startDt.format(urlDateFormat), endDt.format(urlDateFormat));
            request({uri: url, jar: cookieJar}, callback);
        },
        function(response, body, callback) {
            var albumIds = JSON.parse(body).map(function(album) {
                return album.AlbumId;
            });
            getPhotoList(albumIds, cookieJar, callback);
        },
        function(photos, callback) {
            downloadPhotos(self.config.outputPath, photos, callback);
        }
    ], function(err, result) {
        log.debug("done getting photos: "+dateRange);
    });
};
