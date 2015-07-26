# Get messages from an AWS SWS queue

Get messages from `config.queueUrl`, save to `config.output`, and delete messages from queue.

Before running, set bucket permissions and credentials so that worker can 
receive and delete messages.  See
http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html

## config

* `region` - region for SQS queue
* `queueUrl` - SQS queue url
* `output` - save queue messages to this key
