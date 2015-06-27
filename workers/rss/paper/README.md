# RSS paper

Page to display RSS results in a newspaper-like format.  

* Upload `index.html` and `paper.js` to an S3 bucket with static hosting turned on
* Upload `megapis.json` to the same bucket with RSS data:

````
{
    "data":[
        {
            "title":"Ember Blog",
            "url":"http://emberjs.com/blog",
            "items":[
                {
                    "title":"Another Ember 2.x Status Update",
                    "summary":"We're just a few weeks away from the release of Ember 1.13 and Ember 2.0 beta, and while there's been a lot of focus on those releases, the trains will keep rolling on June 12. There will be a 2.1 release 6 weeks hence, and a 2.2 release 6 weeks later...",
                    "url":"http://emberjs.com/blog/2015/05/24/another-two-oh-status-update.html","guid":"http://emberjs.com/blog/2015/05/24/another-two-oh-status-update.html",
                    "image":{},
                    "pubdate":"2015-05-24T00:00:00.000Z"
                },
                ...
            ]
        },
        ...
    ]
}
````

* Upload `paper-config.json` with AWS config info:

````
var paperConfig = {
    awsConfig: {
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: "pool-id-here",
        }),
        region: "us-east-1"
    },
    s3Config: { region: "log-bucket-region" },
    s3Bucket: "log-bucket-name"
};
````

* Create an S3 bucket for read logging as configured above (see http://aws.amazon.com/developers/getting-started/browser/)
* Download files from read logging bucket and save to key set in `excludeKey` in `rss` config
