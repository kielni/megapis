# Send email using Mandrill worker

Gets values to send from `config.id` key; group values by their`source` property.
For each source, load `email_*source*.hbs` Handlebars template, merge with each
value, and append results to a string.

For example, the low tide worker saves its results to the `lowTide` key, and the
`email_lowTide.hbs` template outputs a div for each low tide with the level,
date, and time:

````
<div>
    {{level}} low tide - {{date}} @ {{time}}
</div>
````

Create an array of objects with source and html properties:

````
[
    {
        "source": "lowTide",
        "html" : "<div>\n    -0.1 low tide - 03/06 @ 9:00am\n</div>"
    },
    ...
]
````

Set `sources` to array of source and html objects, and merge with
`*config.id*.hbs*` to produce a message.  For example:

````
{{#each sources}}
    <h4>{{source}}</h4>
    <div>
        {{{html}}}
    </div>
{{/each}}
````

If there is something to send, send an email via Mandrill using 
the API key in `config.mandrill.apiKey`.
