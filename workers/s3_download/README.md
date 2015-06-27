# Download files from an S3 bucket

Download all files from an S3 bucket and save contents to store.  

If no transform is specified, save data as a string like

````
{ "filename": "contents"}
````

If a transform is configured, run the transform function on the data before saving.

Before running, set bucket permissions and credentials so that worker can access bucket.  
See http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html

## config

* `output` - save results to this key
* `bucket` - name of bucket to download
* `transform` - filename containing transform function to run on data before saving (optional; default none)

