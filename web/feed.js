$(document).ready(function() {
    AWS.config = config.awsConfig;
    s3 = new AWS.S3(config.s3Config);
    var params = {
        Bucket: config.s3Bucket
    };
    s3.listObjects(params, function(err, data) {
        if (err) {
            console.log("error=", err);
        } else {
            if (!data.Contents.length) {
            $("#message").html("nothing to see here");
                return;
            }
            $("#message").html("");
            $("#content").show();
            data.Contents.forEach(function(obj) {
                displayFile(obj.Key);
            });
        }
    });
});

function displayFile(filename) {
    var params = {
        Bucket: config.s3Bucket,
        Key: filename
    };
    var key = filename.replace(/\..+/, "");
    s3.getObject(params, function(err, data) {
        $("#"+key).html(data.Body.toString());
        $("#"+key+" .mark-read").attr("data-filename", filename);
        $("#"+key+" .mark-read").on("click", function() {
            deleteFile($(this).attr("data-filename"));
            if ($(".source:visible").length === 0) {
                $("#message").html("nothing to see here");
                $("#content").hide();
            }
        });
    });
}

function deleteFile(filename) {
    var params = {
        Bucket: config.s3Bucket,
        Key: filename
    };
    $("#"+filename.replace(/\..+/, "")).hide();
    s3.deleteObject(params, function(err, data) {
        if (err) {
            console.error(err);
        } else {
            console.log("deleted "+name);
        }
    });
}
