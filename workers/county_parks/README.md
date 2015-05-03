# Santa Clara County Parks events

The Santa Clara County Parks events page (http://www.sccgov.org/sites/parks/pages/calendar.aspx)
shows a paginated events list with the event description in a modal.  All of the event
data is actually loaded at once in a JavaScript file.  Load this file directly, 
extract event details, and send event objects to be included in weeklyEmail.
