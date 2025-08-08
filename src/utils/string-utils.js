const log = () => { }

function getIndentation (line) {
  // log(line)
  let ind = 0
  for (const c of line) {
    if (c === ' ') ind++
    else break
  }
  return ind
}

function pad (indentation, line) {
  let ret = ''
  for (let i = 0; i < indentation; i++) ret += ' '
  return ret + line
}

function getName (_key) {
  if (_key.startsWith('%')) {
    return _key.split(',')[1]
  }
  return _key
}

module.exports = {
  log,
  getIndentation,
  pad,
  getName
}
