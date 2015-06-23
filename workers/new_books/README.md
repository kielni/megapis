# New books

Use Google Books API to get new book releases (title, author, description, publish date, and image)for a list of authors.  The Books API has a rate limit of 1/request/second.  Get only books that are already released, and released within the last `maxAge` days.

## config

`output`: send results to this key
`apiKey`: Google Books API key
`authors`: list of author names
`language`: two-letter language code; if set, get results only in specified language (optional, default all)
`maxAge`: max age of new releases, in days (optional, default 7)
`forSaleIn`: two-letter country code; if set, show only results for sale in specified country (optional)


