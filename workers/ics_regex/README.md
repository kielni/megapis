# .ics regex search

Get .ics from url in `config.source`.  Check summary field for matches of each expression in `config.regexes`. By default, send objects that match at least one regex to `config.output`.  If `config.exclude`, send objects that do not match any of the regexes to `config.output`.


    title: summary,
    link: url,
    dt: datetime
    match: matches.join(", ")
