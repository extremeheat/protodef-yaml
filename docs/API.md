## API

Simple conversion of protodef-yaml format to ProtoDef schema JSON:

```js
const { compile } = require('protodef-yaml')
compile(inputFile = 'proto.yaml', out = 'proto.json')
```

Turn the YAML into standard JSON (intermediate representation, not ProtoDef schema):
```js
const { parse } = require('protodef-yaml')
parse(inputFile = 'proto.yaml', includeComments = true)
```

Turn the YAML into HTML documentation:
```js
const fs = require('fs')
const { parse, genHTML } = require('protodef-yaml')
const inter = parse(inputFile = 'proto.yaml', includeComments = true, followImports = true)
const html = genHTML(inter, { includeHeader: true })
fs.writeFileSync('proto.html', html)
```


### compile(inputFile: string, outputFile: string)
Compile input YAML file into output JSON file


### parse(inputFile: string, includeComments?: boolean, followImports?: boolean)
Compile input YAML file into a JavaScript object.

### genHTML(toTransform: object, options?: { toTitleCase, includeHeader })
* toTransform - Intermediary YAML turned to JSON
* options - Generation options
