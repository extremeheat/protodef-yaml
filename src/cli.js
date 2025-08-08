#!/usr/bin/env node
/**
 * Command Line Interface for protodef-yaml
 * Converts YAML protocol definitions to JSON or HTML output
 */

const { compile, parse } = require('./compiler')
const htmlGen = require('./generators/html')
const fs = require('fs')
const path = require('path')

/**
 * Display usage information
 */
function showUsage () {
  console.warn('protodef-yaml - Convert YAML protocol definitions to JSON or HTML')
  console.warn('')
  console.warn('Usage:')
  console.warn('  protodef-yaml <inputYAML> [output.json | output.html]')
  console.warn('')
  console.warn('Examples:')
  console.warn('  protodef-yaml proto.yaml protocol.json')
  console.warn('  protodef-yaml proto.yaml protocol.html')
  console.warn('  protodef-yaml proto.yaml  # outputs proto.json')
}

/**
 * Main CLI function
 */
function main () {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage()
    return
  }

  const inputFile = args[0]
  const outputFile = args[1] || (path.parse(inputFile).name + '.json')

  try {
    // Validate input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file '${inputFile}' not found`)
      process.exit(1)
    }

    if (outputFile.endsWith('.html')) {
      // Generate HTML documentation
      const intermediary = parse(inputFile, true, true)
      const schemaSegmented = Object.keys(intermediary).some(key =>
        key.startsWith('^') || key.startsWith('%container,^')
      )
      const html = htmlGen(intermediary, {
        includeHeader: true,
        schemaSegmented
      })
      fs.writeFileSync(outputFile, html)
    } else {
      // Generate JSON schema
      compile(inputFile, outputFile)
    }

    console.info('✔ Successfully generated:', outputFile)
  } catch (error) {
    console.error('✗ Error:', error.message)
    process.exit(1)
  }
}

// Run CLI if this module is executed directly
if (require.main === module) {
  main()
}

module.exports = { main }
