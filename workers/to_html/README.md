# Make HTML

Make HTML by merging values in *workerId* with a Handlebars template `config/*workerId*.hbs`

- load list of values from *workerId*
- load and compile `config/*workerId*.hbs` Handlebars template
- merge template with 

````
    { 
        "values": [ *values from *workerId* ],
        "createDate": "ddd M/D h:mm a"
    }
````

## config

`output` - save HTML to this key
