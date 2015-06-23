var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker"),
    temporal = require("temporal"),
    request = require("request"), 
    moment = require("moment"),
    _ = require("lodash"),
    util = require("util");

var MegapisWorker = require("megapis-worker").MegapisWorker;

function BooksWorker(config) {
    BooksWorker.super_.call(this, config);
}
 
util.inherits(BooksWorker, MegapisWorker);

exports.createWorker = function(config) {
    return new BooksWorker(config);
};

BooksWorker.prototype.getConfigKeys = function() {
    return ["output", "apiKey", "authors"];
};

function getAuthorResults(url, minDate, forSaleIn, callback) {
    var books = {};
    var today = moment();
    request(url, function(err, response, body) {
        if (err) throw err;
        var data = JSON.parse(body);
        data.items.forEach(function(item) {
            var dt = moment(item.volumeInfo.publishedDate, "YYYY-MM-DD");
            var title = item.volumeInfo.title;
            log.debug("title="+title+" date="+item.volumeInfo.publishedDate);
            // skip if too old or not yet released
            if (dt.isAfter(today) || dt.isBefore(minDate)) {
                log.debug(title+" doesn't pass date criteria ", item.volumeInfo.publishedDate);
                return;
            }
            // skip if not for sale
            if (forSaleIn && item.saleInfo && item.saleInfo.country === forSaleIn &&
                item.saleInfo.saleability === "NOT_FOR_SALE") {
                log.debug(title+" not for sale");
                return;
            }
            // seem to be duplicate entries with the same id
            books[item.id] = {
                id: item.id,
                publishedDate: dt.format("MM/DD/YYYY"),
                imageUrl: item.volumeInfo.imageLinks.smallThumbnail,
                description: item.volumeInfo.description,
                title: title,
                author: item.volumeInfo.authors.join()
            };
        });
        var bookList = _.values(books);
        callback(null, _.values(bookList));
    });
}

BooksWorker.prototype.run = function() {
    var apiUrl = "https://www.googleapis.com/books/v1/volumes?key="+this.config.apiKey;
    apiUrl += "&orderBy=newest";
    if (this.config.language) {
        apiUrl += "&langRestrict="+this.config.language;
    }
    var self = this;
    var books = [];
    var maxAge = this.config.maxAge || 7;
    var minDt = moment().subtract(maxAge, "days");
    var forSaleIn = this.config.forSaleIn;
    // get books for each author, one per second (Google Books API rate limit)
    var tasks = [];
    this.config.authors.forEach(function(author) {
        var url = apiUrl+"&q=inauthor:\""+encodeURIComponent(author)+"\"";
        tasks.push({
            delay: 1200,
            task: function() {
                log.debug("starting getAuthorResults for "+author);
                getAuthorResults(url, minDt, forSaleIn, function(err, data) {
                    log.debug("done getAuthorResults: found "+data.length+" books");
                    if (data) {
                        books = books.concat(data);
                    }
                });
            }
        });
    });
    // after getting all the books, save and forward to output key
    tasks.push({
        delay: 5000,
        task: function() {
            log.debug("starting save task");
            self.saveAndForward(books);
        }
    });
    temporal.queue(tasks);
};
