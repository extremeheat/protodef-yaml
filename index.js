const { compile, parse } = require('./compiler')
const genHTML = require('./generators/html')

module.exports = { compile, parse, genHTML }

if (typeof window !== 'undefined') window.protoyaml = module.exports