# Send email using Mandrill worker

Gets values to send from `config.storageKeys.self`, merges values with
`config.sourceTemplates[source]`, and sends a message using Mandrill.
