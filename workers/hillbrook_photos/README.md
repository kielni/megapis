# Get photos from school website

Download photos from school website to `config.outputPath` for a date range.

* login using `config.username` and `config.password`
* then get list of albums for date range today-`config.fromDaysAgo` through today from JSON archive page
* load each album page and get list of photos
* download photos to `config.outputPath`/*album name*
