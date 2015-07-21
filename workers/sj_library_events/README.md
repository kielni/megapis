# Get library events

Get San Jose Library events from an events widget (http://events.sjpl.org/help/widget).  Use x-ray to 
get events page and extract events.  Drop any that match `config.excludeRegex`, and add to `weeklyEmail`.

## Sample object

````
{
    "dateTime":"Sat 5/30 2:00pm",
    "title":"All Kinds of People with Gary Lapow",
    "description":"Come join us for a special performance by Gary Lapow! Using his musical magic, humor, and original songs, Gary guides children to find practical ways of getting along with...",
    "branch":"Hillview Branch Library",
    "calendarUrl":"https://www.google.com/calendar/render..."
}
````
