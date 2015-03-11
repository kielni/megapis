#!/usr/bin/env node

var fs = require("fs-extra"),
    handlebars = require("handlebars"),
    exec = require('child_process').exec;

if (process.argv.length < 3) {
    console.log("usage: node new_worker <worker_name> <worker_directory>");
    process.exit(1);
}
var name = process.argv[2];
var path;
if (process.argv.length > 2) {
    path = process.argv[3];
    if (!/\/$/.test(path)) {
        path += "/";
    }
} else {
    path = "";
}
path += name.replace(/-/g, "_");
var workerId = name.replace(/(?:^|[-_])(\w)/g, function (_, c) {
    return c ? c.toUpperCase () : '';
});

var gitUrl = process.env.MEGAPIS_GIT_URL || "";
var author = process.env.MEGAPIS_AUTHOR || "";

function copyFile(name, path) {
    console.log("copying blueprints/"+name+" to "+path+"/"+name);
    fs.copySync("blueprints/"+name, path+"/"+name, { replace: false });
}

fs.mkdirSync(path);
console.log("created "+path+" path");
copyFile("index.js", path);
copyFile(workerId+".json", path);
copyFile("README.md", path);
// load package.json.hbs, merge with name
var template = handlebars.compile(fs.readFileSync("blueprints/package.json.hbs", "utf-8"));
// write package.json
var data = {
    "name": name,
    "gitUrl": gitUrl,
    "author": author
};
fs.writeFileSync("blueprints/package.json", template(data));
copyFile("package.json", path);
fs.unlinkSync("blueprints/package.json");

process.chdir(path);
console.log("generated worker "+name);
exec("npm install").stdout.pipe(process.stdout);

