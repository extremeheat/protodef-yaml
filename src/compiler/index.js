const fs = globalThis.window ? null : require('fs')
const { toYAML, parseYAML, getIntermediate } = require('../parser/yaml-parser')
const { transform, formFinal, applyStructuringTf } = require('../transformer/json-transformer')

function compile (input, output, applyStructuringTransform = true) {
  let ret = formFinal(transform(parseYAML(toYAML(input))))
  if (applyStructuringTransform) ret = applyStructuringTf(ret)
  if (typeof output === 'string') fs.writeFileSync(output, JSON.stringify(ret, null, 2))
  return ret
}

function parse (input, includeComments, followImports = false) {
  return getIntermediate(input, includeComments, followImports)
}

module.exports = { compile, parse }
