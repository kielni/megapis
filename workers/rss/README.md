# Get RSS

Use Feedparser to get and parse RSS data and save results to the store.

## config

* `output` - save results to this key
* `urls` - array of RSS urls
* `maxDaysOld` - skip URLs with a published date older than this many days (optional; default no limit)
* `maxItemsPerFeed` - keep up to this many items per feed (optional; default is all in first page)
* `excludeKey` - array of content URLs to exclude (optional; default none)
