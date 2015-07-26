# Prime Kindle lending library

Get Kindle lending library eligible books from genre page(s) in `config.urls`.
Go to each book's product page to get its description and save to `config.output`.
If `config.exclude` is set, get exclude any matching URLs.

## sample object


    {
        "asin":"B00SM2U12A",
        "title":"Crazy Love",
        "author":"Casey L. Bond",
        "url":"http://www.amazon.com/Crazy-Love-Casey-L-Bond-ebook/dp/B00SM2U12A",
        "description":"Shelby Case avoids town and all the people in it. She can't stand the whispers behind covered lips, the judgmental stares. People say she's crazy, that she lost her mind when she lost her husband. \r\rThe Second U.S. Civil War has left widows and widowers scattered across the land. Shelby's just learned to cope. She's taught herself the fine art of self-preservation along with the skills to survive. \r\rWhen the figment of her imagination, the man who's haunted her days and nights for the past two y...",
        "tag":"Crazy Love, Casey L. Bond, Anna Coy - Amazon.com",
        "source":"primeBooks"
    }
