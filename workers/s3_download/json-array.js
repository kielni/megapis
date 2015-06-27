var log4js = require("log4js"),
    log = log4js.getLogger("megapis-worker");

/*
    transform data like { "filename1": ["x","y","z"], "filename2": ["a","b","c"] }
    to ["x","y","z","a","b","c"]
 */
exports.transform = function(data) {
    var jsonData = [];
    Object.keys(data).forEach(function(key) {
        var value = JSON.parse(data[key]);
        log.debug("key="+key+" value=", value);
        jsonData = jsonData.concat(value);
    });
    return jsonData;
};
