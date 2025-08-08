# protodef-yaml Source Code

This directory contains the modular source code for protodef-yaml, organized into logical components with clear separation of concerns.

## Directory Structure

```
src/
├── cli.js              # Command line interface
├── index.js            # Main module exports
├── compiler/           # Compilation orchestration
│   └── index.js        # Main compilation functions
├── generators/         # Output format generators
│   ├── html.js         # HTML documentation generator
│   └── json2yml.js     # JSON to YAML converter
├── parser/             # YAML parsing and preprocessing
│   └── yaml-parser.js  # YAML preprocessing and parsing
├── transformer/        # JSON transformation logic
│   └── json-transformer.js  # Transforms parsed YAML to ProtoDef format
└── utils/              # Shared utility functions
    └── string-utils.js # String manipulation helpers
```

## Architecture Overview

The compilation pipeline follows this flow:

1. **Parser** (`parser/yaml-parser.js`): Preprocesses YAML input, handles imports, and converts to valid YAML
2. **Transformer** (`transformer/json-transformer.js`): Transforms parsed YAML into ProtoDef JSON structure
3. **Compiler** (`compiler/index.js`): Orchestrates the entire compilation process
4. **Generators** (`generators/`): Generate output in various formats (HTML, JSON)
5. **Utils** (`utils/`): Provide shared functionality across modules

## Key Components

### Compiler (`compiler/index.js`)
The main orchestration module that:
- Coordinates the compilation pipeline
- Handles error management
- Provides the main `compile()` and `parse()` functions

### Parser (`parser/yaml-parser.js`)
Responsible for:
- Converting custom YAML syntax to standard YAML
- Processing import statements
- Handling comments and documentation
- Validating input structure

### Transformer (`transformer/json-transformer.js`)
Handles:
- Converting parsed YAML to ProtoDef JSON schema
- Processing arrays, switches, and containers
- Applying structural transformations
- Final formatting and optimization

### Generators (`generators/`)
Provide output formatting:
- **HTML Generator**: Creates interactive documentation
- **JSON2YAML Converter**: Converts JSON back to YAML format

### Utils (`utils/string-utils.js`)
Shared utilities for:
- String manipulation and formatting
- Indentation handling
- Name extraction from special keys

## Usage

```javascript
const { compile, parse } = require('./compiler')

// Compile YAML to ProtoDef JSON
const schema = compile('input.yaml', 'output.json')

// Parse for documentation/analysis
const intermediate = parse('input.yaml', true, true)
```

## Error Handling

All modules include comprehensive error handling with meaningful error messages to help users diagnose issues with their YAML input.

## Testing

The modular structure enables better testing of individual components. All modules maintain backward compatibility with the existing test suite.