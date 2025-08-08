const fs = globalThis.window ? null : require('fs')
const Path = globalThis.window ? null : require('path')
const yaml = require('js-yaml')
const { getIndentation, pad } = require('../utils/string-utils')

// make valid yaml
function toYAML (input, followImports = true, document = false) {
  const files = {}
  if (typeof input === 'string') {
    files.main = fs.readFileSync(input, 'utf8')
  } else {
    Object.assign(files, input)
  }

  const imported = []

  function checkIfJson (key, val) { //  ¯\(°_o)/¯
    if (key.includes('"') || val.includes('[[') || val.includes('[{') || val.includes('{') || val.includes('}')) return true
    if (!val.includes('[]') && val.includes('[')) return true
    if (!val.includes('[]') && val.includes(']')) return true
    for (const c of ['[', ']', '{', '}']) if (key.includes(c)) return true
    return false
  }

  function validateKey (line, key) { }

  if (!files.main) throw new Error('A `main` file is required. Files given: ' + Object.keys(files).join(', '))
  let data = files.main
  data = data.replace(/\t/g, '    ')
  const lines = data.split('\n')

  let startedDocumenting = false

  function pars () {
    let modified = false
    let lastNonCommentPaddingLevel
    for (let i = 0; i < lines.length; i++) {
      const trimedLine = lines[i].trim()
      let [key, val] = trimedLine.endsWith(':') ? [trimedLine.slice(0, -1), ''] : trimedLine.split(': ', 2)
      const thisLevel = getIndentation(lines[i])
      const nextLevel = getIndentation(lines[i + 1] || '')
      if (key.startsWith('#')) {
        const commentPadLevel = (thisLevel === 0) ? lastNonCommentPaddingLevel : thisLevel
        if ((key.startsWith('# ') || key === '#') && startedDocumenting && document) { // Convert the YAML comments to entries
          key = '!comment,' + i
          val = lines[i].replace('#', '')
          if (val.trim() === '') { // blank new line
            lines[i] = pad(commentPadLevel, `${key}: "\\n"`)
          } else {
            lines[i] = pad(commentPadLevel, key + ': |\n')
            lines[i] += pad(commentPadLevel + 3, val)
          }
        } else {
          continue
        }
      } else {
        lastNonCommentPaddingLevel = thisLevel
      }
      key = key.trim(); val = val ? val.trim() : ''
      if (key === '_') {
        const nkey = '__' + i
        lines[i] = lines[i].replace(key, nkey)
        key = nkey
      }
      if (!key) continue
      if (key.startsWith('!')) {
        if (key.startsWith('!StartDocs')) startedDocumenting = true
        if (key.startsWith('!EndDocs')) startedDocumenting = false
        if ((key === '!import') && !imported.includes(val) && followImports) {
          if (modified) {
            throw Error('Incorrectly placed import, place it ontop of the file')
          }
          imported.push(val)
          let imp = files[val]
          if (!imp && typeof input === 'string') {
            console.log('Path', input, Path.dirname(input))
            imp = fs.readFileSync(Path.dirname(input) + '/' + val, 'utf-8')
          } else if (!imp) {
            throw new Error('Import file not found: ' + val)
          }
          imp = imp.replace(/\t/g, '    ')
          lines.splice(i, 0, ...imp.split('\n'))
          return true
        }
        let nkey = key.replace('!', "'!")
        if ((key === '!import') || key.includes('Docs')) nkey += ',' + i
        nkey += "'"
        lines[i] = lines[i].replace(key, nkey)
        // Enforce parsing as string if we have a float like 1.20
        if (!isNaN(val) && (val.includes('.') && val.endsWith('0'))) {
          lines[i] = lines[i].replace(': ', ': !!str ')
        }
        continue
      }

      if (checkIfJson(key, val)) {
        // console.debug('Ignoring JSON', lines[i])
        continue
      }

      validateKey(lines[i], key)

      // Ignore comment parts when processing values
      val = val.split('#')[0].trim()
      const isParent = nextLevel > thisLevel
      if (isParent) {
        modified = true
        // console.info(lines[i])
        if (val.includes('[]')) {
          const [type, countType] = val.split('[]')
          if (type) throw Error('Array type cannot be both container and ' + type + ' at ' + val)
          lines[i] = pad(thisLevel, `"%array,${key},${type},${countType}":`)
        } else if (val.includes('=>')) {
          const type = val.replace('=>', '').trim()
          lines[i] = pad(thisLevel, `"%map,${key},${type}":`)

          if (document) { // we need index numbers for the docs
            let autoIncrementPos = 0
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[j].startsWith('- '.padStart(nextLevel + 2))) {
                lines[j] = lines[j].replace('- ', autoIncrementPos++ + ': ')
              } else if (!lines[j].trim().startsWith('#')) {
                break
              }
            }
          }
        } else if (val.includes('?')) {
          val = val.replace('?', '').trim()
          lines[i] = pad(thisLevel, `"%switch,${key},${val}":`)
        } else if (val && !val.startsWith('#')) {
          console.log('at ', lines[i - 1])
          console.log('AT ', lines[i])
          console.log('at ', lines[i + 1])
          console.log(val)
          throw Error(`Unexpected child block at line ${i}`)
        } else if (!key.startsWith('if')) {
          lines[i] = pad(thisLevel, `"%container,${key},${val}":`)
        }
      } else {
        if (val.includes('[]')) {
          const [type, countType] = val.split('[]')
          lines[i] = pad(thisLevel, `"%array,${key},${type},${countType}":`)
        } else if (!isNaN(key.replace(/'/g, ''))) {
          // Because JS sorts objects weird, we need to encapsulate numeric type
          // keys to ensure proper ordering with '%n,NUMBER'
          const num = key.replace(/'/g, '')
          lines[i] = pad(thisLevel, `'%n,${parseInt(num)}': ${val}`)
        } else if (val.includes('=>')) {
          const [sizeType, valueType] = val.split('=>')
          lines[i] = pad(thisLevel, `"%map,${key},${sizeType.trim()},${valueType.trim()}":`)
          if (document) { // we need index numbers for the docs
            let autoIncrementPos = 0
            for (let j = i + 1; j < lines.length; j++) {
              if (lines[j].startsWith('- '.padStart(thisLevel + 2))) {
                lines[j] = lines[j].replace('- ', '  ' + autoIncrementPos++ + ': ')
              } else if (lines[j].startsWith('#'.padStart(thisLevel + 1))) { // we need to pad the comments
                lines[j] = lines[j].replace('#'.padStart(thisLevel + 1), '  ' + '#'.padStart(thisLevel + 1))
              } else {
                break
              }
            }
          }
        }
      }
    }
  }
  while (pars()) { console.info('Importing', imported[imported.length - 1]) }

  return lines
}

function parseYAML (lines) {
  try {
    let ret
    yaml.loadAll(lines.join('\n'), d => { ret = d })
    return ret
  } catch (e) {
    if (e instanceof yaml.YAMLException) {
      delete e.mark // remove logging spam
    }
    throw e
  }
}

function getIntermediate (input, includeComments, followImports = false) {
  return parseYAML(toYAML(input, followImports, includeComments))
}

module.exports = {
  toYAML,
  parseYAML,
  getIntermediate
}
