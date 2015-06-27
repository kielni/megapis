/*
var paperConfig = {
    awsConfig: {
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: "pool-id",
        }),
        region: "us-east-1"
    },
    s3Config: { region: "us-west-1" },
    s3Bucket: "bucket-name"
};
 */
$(document).ready(function() {
    AWS.config = paperConfig.awsConfig;
    s3 = new AWS.S3(paperConfig.s3Config);
    var columns = 3;
    var source = $("#sourceTemplate").html();
    var template = Handlebars.compile(source);
    var latest = moment(0);
    $.getJSON("megapis.json", function(result) {
        result.data.sort(function(a, b) {
            return a.title.localeCompare(b.title);
        });
        result.data.forEach(function(source, srcIndex) {
            var sourceId = "src"+srcIndex;
            source.sourceId = sourceId;
            source.items.forEach(function(item, index) {
                item.sourceId = sourceId;
                var dt = moment(item.pubdate);
                item.date = dt.format("ddd h:mma");
                if (dt.isAfter(latest)) {
                    latest = dt;
                }
            });
            var html = template(source);
            var col = srcIndex % columns;
            $("#col"+col).append(html);
        });
        $("#date").html("as of "+latest.format("ddd h:mma"));
        $(".link").on("click", function() {
            clickthrough($(this).attr('data'));
        });
        $(".mark-read").on("click", function() {
            var sourceId = $(this).attr('data');
            var urls = [];
            $("#"+sourceId+" li a").each(function() {
                urls.push($(this).attr('data'));
            });
            markRead(urls);
        });
    })
  .fail(function() {
    console.log( "error" );
  });
});

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
function clickthrough(url) {
    writeFile([url]);
}

function markRead(urls) {
    writeFile(urls);
}
