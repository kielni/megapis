# Santa Clara County Parks events

The Santa Clara County Parks events page (http://www.sccgov.org/sites/parks/pages/calendar.aspx)
shows a paginated events list with the event description in a modal.  All of the event
data is actually loaded at once in a JavaScript file.  Load this file directly, 
extract event details, and send event objects to be included in weeklyEmail.

## Sample object


    {
        "date":"Sat 5/23",
        "dt":20150523,
        "url":"http://www.sccgov.org/sites/parks/parkfinder/Pages/AlmadenPark.aspx",
        "calendarUrl":"https://www.google.com/calendar/render?...",
        "description":"Come hone your drawing skills while enjoying a pleasant morning at the park. Increase your confidence in drawing and learn skills to help you draw what you see. Materials provided, but feel free to bring your own sketch pad, pencil, and portable set of colored pencils or watercolors. Appropriate for adults and/or children ages 8 and up accompanied by an adult. All skill levels welcome. Meet at the Mockingbird Hill entrance. Register online or call (408) 355-2201",
        "title":"Nature Drawing",
        "time":"10:00 AM - 11:30 AM",
        "location":"Mockingbird Hill park entrance at Almaden Quicksilver"
    }
