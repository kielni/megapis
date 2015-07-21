# Prime new movies

Get list of movies from Prime Instant Video urls in `config.urls`.  
Get detail page for each movie, and save title, URL, image, description, rating,
and rating count for new items and save new items to `config.output`.

## Sample object

````
{
    "link": "http://www.amazon.com/Spring-Lou-Taylor-Pucci/dp/B00UBRJ6MA",
    "thumb":"http://ecx.images-amazon.com/images/I/41D8EoPSXAL._PI_PJStripeHD-Prime-500px02,TopLeft,0,0_AA200_.jpg",
    "asin":"B00UBRJ6MA",
    "title":"Spring",
    "Title":"Spring",
    "Year":"2014",
    "Rated":"NOT RATED",
    "Released":"20 Mar 2015",
    "Runtime":"109 min",
    "Genre":"Horror, Romance, Sci-Fi",
    "Director":"Justin Benson, Aaron Moorhead",
    "Writer":"Justin Benson",
    "Actors":"Lou Taylor Pucci, Nadia Hilker, Vanessa Bednar, Shane Brady",
    "Plot":"A young man in a personal tailspin flees the US to Italy, where he sparks up a romance with a woman harboring a dark, primordial secret.",
    "Language":"English",
    "Country":"USA",
    "Awards":"3 wins & 2 nominations.",
    "Poster":"http://ia.media-imdb.com/images/M/MV5BMjMwNzM2OTk3OF5BMl5BanBnXkFtZTgwNjExOTU0NDE@._V1_SX300.jpg",
    "Metascore":"69",
    "imdbRating":"6.6",
    "imdbVotes":"6,552",
    "imdbID":"tt3395184",
    "Type":"movie",
    "Response":"True"}

````
