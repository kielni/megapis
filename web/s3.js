// write file to S3; filename=timestamp, contents=list of URLs
function writeFile(urls) {
    var now = new Date().getTime();
    var content = JSON.stringify(urls);
    var params = {
        Bucket: paperConfig.s3Bucket,
        Key: now+"",
        Body: content,

    };
    s3.putObject(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            console.log(data);
        }
    });
}

function markExclude(key) {
    var params = {
        QueueUrl: config.QueueUrl,
        MessageBody: key
    };
    sqs.sendMessage(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            console.log(data);
        }
    });
}
