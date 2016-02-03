# Get details on Steam games

Get Steam category search page `config.url`, like http://store.steampowered.com/search/results?sort_by=Released_DESC&category2=9

Get games that are at least `config.minAge` days old and no more than `config.maxAge` days old.  Fetch game data and send to `config.output`

Game data: title, url, description, thumb, date, title, players, reviews, genres, positive, negative, tags, features

Exclude games which match regex in `config.exclude`.
