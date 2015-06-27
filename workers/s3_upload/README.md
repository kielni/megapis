# Upload data from a key to an S3 bucket

Get value for `worker.id` from the store and upload as `config.key` to S3 bucket.

Before running, set bucket permissions and credentials so that worker can access bucket.  See 
http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html

## config

* `bucket` - name of bucket to upload to
* `key` - name for S3 file
