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
            data.Contents.forEach(function(obj, index) {
                displayFile(obj.Key, index);
            });
        }
    });
});

function displayFile(filename, index) {
    var params = {
        Bucket: config.s3Bucket,
        Key: filename
    };
    s3.getObject(params, function(err, data) {
        var id = "#"+filename.replace(/\..+/, "");
        $(id).html(data.Body.toString());
        $(id+" .mark-read").attr("data-filename", filename);
        $(id+" .mark-read").attr("data-id", id);
        var col = "#col"+(index%2);
        $(col).append($(id+"Container").html());
        $(id+" .mark-read").on("click", function() {
            var contentId = $(this).attr("data-id");
            $(contentId).hide();
            $(contentId+"Nav").hide();
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
