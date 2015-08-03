$(document).ready(function() {
    AWS.config = config.awsConfig;
    sqs = new AWS.SQS(config.s3Config);
    var book = $("#bookTemplate").html();
    var template = Handlebars.compile(book);
    $.getJSON("megapis-books.json", function(result) {
        result.data.forEach(function (item) {
            var html = template(item);
            $("#content").append(html);
        });
        $(".mark-read").on("click", function() {
            var contentId = $(this).attr("data-id");
            markExclude(contentId);
            $("#"+contentId).hide();
        });
    });
});

