# API Documentation

This document provides details on the API functions available in the `protodef-yaml` module.
For more information on the YAML syntax itself, please refer to the [main README](../README.md).

## `compile(inputFile: string, outputFile?: string): ProtoDefSchema`

Converts a `protodef-yaml` encoded string or file into a final ProtoDef JSON schema.
This function handles the entire transformation pipeline, including parsing YAML, resolving `!import` directives, processing special syntax (e.g., `%array`, `^type.path`), and structuring the output.

*   **`inputFile`**: `string` - Path to the main input YAML file.
*   **`outputFile`** (optional): `string` - If provided, the resulting JSON schema will be written to this file path.
*   **Returns**: `ProtoDefSchema` - The compiled ProtoDef schema as a JavaScript object.

**Example:**

```javascript
const { compile } = require('protodef-yaml');
const path = require('path');

// Example 1: Compile and get the schema as an object
const schema = compile(path.join(__dirname, 'input.yml'));
console.log(JSON.stringify(schema, null, 2));

// Example 2: Compile and write to an output file
try {
  compile(path.join(__dirname, 'input.yml'), path.join(__dirname, 'output.json'));
  console.log('output.json generated successfully!');
} catch (error) {
  console.error('Compilation failed:', error);
}
```
*(Ensure you have an `input.yml` in the same directory for this example to run)*

## `parse(inputFile: string, options?: ParseOptions): ProtoDefSchema`

Parses a `protodef-yaml` encoded string or file and returns its intermediate JavaScript object representation. This representation is the structure before the final transformation into the strict ProtoDef schema format but after initial YAML parsing and some preprocessing (like `!import` and shorthand expansion to `%` types). It may include special parsing keys (e.g., keys starting with `%`).

*   **`inputFile`**: `string` - Path to the main input YAML file.
*   **`options`** (optional): `ParseOptions` - An object with the following optional properties:
    *   `includeComments?: boolean` (default: `false`): If `true`, YAML comments (`# comment`) will be converted into `!comment` nodes in the intermediate representation. This is useful for documentation generation.
    *   `followImports?: boolean` (default: `true`): If `true`, `!import` directives will be processed and their content included. If `false`, `!import` directives are ignored.
*   **Returns**: `ProtoDefSchema` - The intermediate JavaScript object representation. While typed as `ProtoDefSchema`, it may contain structures specific to the parsing stage not present in the final compiled schema.

**Example:**

```javascript
const { parse } = require('protodef-yaml');
const path = require('path');

// Example: Parse with options
const intermediateSchema = parse(path.join(__dirname, 'input.yml'), {
  includeComments: true,
  followImports: true
});
console.log(JSON.stringify(intermediateSchema, null, 2));

// Example: Parse with default options
const defaultParsedSchema = parse(path.join(__dirname, 'input.yml'));
// console.log(JSON.stringify(defaultParsedSchema, null, 2));
```
*(Ensure you have an `input.yml` in the same directory for this example to run)*

## `genHTML(parsedObject: ProtoDefSchema, options?: GenHTMLOptions): string`

Generates an HTML documentation page from a parsed `ProtoDefSchema` object (typically the output of the `parse` function, especially when `includeComments` was true).

*   **`parsedObject`**: `ProtoDefSchema` - The JavaScript object to transform into HTML. This should be the intermediate representation from `parse`.
*   **`options`** (optional): `GenHTMLOptions` - An object with the following optional properties:
    *   `includeHeader?: boolean` (default: `false`): If `true`, a basic HTML header with some CSS is included. Set this to `true` for a standalone HTML document. If you intend to embed the output into an existing webpage with its own styling, you might set this to `false`.
    *   `schemaSegmented?: boolean` (default: `false`): If `true`, indicates that the schema might be segmented (e.g., using the `^` caret syntax for namespaces like `^namespace.type`). This can affect how the HTML is structured, potentially grouping types by these namespaces.
*   **Returns**: `string` - The generated HTML as a string.

**Example:**

```javascript
const { parse, genHTML } = require('protodef-yaml');
const fs = require('fs');
const path = require('path');

const intermediate = parse(path.join(__dirname, 'input.yml'), { includeComments: true });
const html = genHTML(intermediate, {
  includeHeader: true,
  schemaSegmented: true // Assuming input.yml might use caret syntax
});

try {
  fs.writeFileSync(path.join(__dirname, 'proto-docs.html'), html);
  console.log('proto-docs.html generated successfully!');
} catch (error) {
  console.error('HTML generation failed:', error);
}
```
*(Ensure you have an `input.yml` in the same directory for this example to run)*

## `genYAML(json: object): string`

Converts a JavaScript object (typically a simplified ProtoDef-like schema or a part of it) into the `protodef-yaml` string syntax. This is useful for programmatically generating or modifying `protodef-yaml` files.

*   **`json`**: `object` - The JavaScript object to convert. The structure should resemble a ProtoDef schema, using arrays for containers, mappers, switches, etc., where appropriate.
*   **Returns**: `string` - The `protodef-yaml` syntax as a string.

**Example:**

```javascript
const { genYAML } = require('protodef-yaml');

const mySchemaPart = {
  packet_name: [
    'container',
    [
      { name: 'field_a', type: 'i32' },
      { name: 'optional_field_b', type: ['option', 'bool'] },
      {
        name: 'status_mapper',
        type: ['mapper', { type: 'u8', mappings: { 0: 'ok', 1: 'error' } }]
      }
    ]
  ],
  simple_type: 'string'
};

const yamlString = genYAML(mySchemaPart);
console.log(yamlString);
/*
Output:
packet_name:
  field_a: i32
  optional_field_b?: bool
  status_mapper: u8 =>
    0: ok
    1: error
simple_type: string
*/

// Example with a more direct structure (less nesting than full ProtoDef)
const simpleJson = {
  my_type: 'i32',
  my_container: {
    field1: 'string',
    field2: 'bool'
  }
};
const yamlSimple = genYAML(simpleJson);
console.log(yamlSimple);
/*
Output:
my_type: i32
my_container:
  field1: string
  field2: bool
*/
```
