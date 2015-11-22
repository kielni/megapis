# RSS feed regex search

Get each RSS feed in `config.feeds`.  For each item newer than `config.maxHoursOld`, check for matches of each expression in `config.regexes`.  Send new objects to `config.output` like 


    title: item.title,
    link: item.link,
    summary: feedUtils.stripHtml(item.summary),
    pubdate: item.pubdate,
    match: matches.join(", ")
