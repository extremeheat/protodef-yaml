const { compile, parse } = require('./src/compiler')
const genHTML = require('./src/generators/html')
const genYAML = require('./src/generators/json2yml')

module.exports = { compile, parse, genHTML, genYAML }

if (typeof window !== 'undefined') window.protoyaml = module.exports
