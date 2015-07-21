# New books

Use Google Books API to get new book releases (title, author, description, publish date, and image)for a list of authors.  The Books API has a rate limit of 1/request/second.  Get only books that are already released, and released within the last `maxAge` days.

## sample object

    {
        "id":"5hrgCQAAQBAJ",
        "publishedDate":"06/12/2015",
        "imageUrl":"http://books.google.com/books/content?id=5hrgCQAAQBAJ&...",
        "description":"A comedy of loyalty, betrayal, sex, madness, and music-swapping Art is an up-and-coming interface designer, working on the management of data flow along the Massachusetts Turnpike. He's doing the best work of his career and can guarantee that the system will be, without a question, the most counterintuitive, user-hostile piece of software ever pushed forth onto the world. Why? Because Art is an industrial saboteur. He may live in London and work for an EU telecommunications megacorp, but Art's real home is the Eastern Standard Tribe. Instant wireless communication puts everyone in touch with everyone else, twenty-four hours a day. But one thing hasn't changed: the need for sleep. The world is slowly splintering into Tribes held together by a common time zone, less than family and more than nations. Art is working to humiliate the Greenwich Mean Tribe to the benefit of his own people. But in a world without boundaries, nothing can be taken for granted-not happiness, not money, and most certainly not love. Which might explain why Art finds himself stranded on the roof of an insane asylum outside Boston, debating whether to push a pencil into his brain....",
        "title":"Eastern Standard Tribe",
        "author":"Cory Doctorow",
        "isbn": "9789635230549"
    }

## config

`output`: send results to this key
`apiKey`: Google Books API key
`authors`: list of author names
`language`: two-letter language code; if set, get results only in specified language (optional, default all)
`maxAge`: max age of new releases, in days (optional, default 7)
`forSaleIn`: two-letter country code; if set, show only results for sale in specified country (optional)


