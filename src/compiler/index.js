/**
 * Main compiler module for protodef-yaml
 * Orchestrates the compilation pipeline from YAML to ProtoDef JSON schema
 */

const fs = globalThis.window ? null : require('fs')
const { toYAML, parseYAML, getIntermediate } = require('../parser/yaml-parser')
const { transform, formFinal, applyStructuringTf } = require('../transformer/json-transformer')

/**
 * Compiles YAML input to ProtoDef JSON schema
 * @param {string|object} input - File path or object containing YAML content
 * @param {string} [output] - Output file path. If provided, writes to file
 * @param {boolean} [applyStructuringTransform=true] - Whether to apply structuring transformations
 * @returns {object} The compiled ProtoDef JSON schema
 * @throws {Error} When input is invalid or compilation fails
 */
function compile (input, output, applyStructuringTransform = true) {
  try {
    // Stage 1: Convert to valid YAML format
    const yamlContent = toYAML(input)

    // Stage 2: Parse YAML to intermediate JSON
    const parsedJson = parseYAML(yamlContent)

    // Stage 3: Transform to ProtoDef structure
    const transformed = transform(parsedJson)

    // Stage 4: Apply final formatting
    let result = formFinal(transformed)

    // Stage 5: Apply structuring transformations if requested
    if (applyStructuringTransform) {
      result = applyStructuringTf(result)
    }

    // Stage 6: Write to file if output path provided
    if (typeof output === 'string') {
      if (!fs) {
        throw new Error('File system operations not available in browser environment')
      }
      fs.writeFileSync(output, JSON.stringify(result, null, 2))
    }

    return result
  } catch (error) {
    throw new Error(`Compilation failed: ${error.message}`)
  }
}

/**
 * Parses YAML input to intermediate representation for documentation/analysis
 * @param {string|object} input - File path or object containing YAML content
 * @param {boolean} [includeComments=false] - Whether to include comments in output
 * @param {boolean} [followImports=false] - Whether to follow import statements
 * @returns {object} Intermediate representation of the parsed YAML
 * @throws {Error} When parsing fails
 */
function parse (input, includeComments = false, followImports = false) {
  try {
    return getIntermediate(input, includeComments, followImports)
  } catch (error) {
    throw new Error(`Parsing failed: ${error.message}`)
  }
}

module.exports = { compile, parse }
