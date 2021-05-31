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
const inter = parse(inputFile = 'proto.yaml', includeComments = true)
const html = genHTML(inputFile = 'proto.yaml', includeComments = true)
fs.writeFileSync('proto.html', html)
```