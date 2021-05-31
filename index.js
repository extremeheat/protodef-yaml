const { compile, parse } = require('./compiler')
const genHTML = require('./generators/html')

module.exports = { compile, parse, genHTML }