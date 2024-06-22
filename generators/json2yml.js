function toYAML(obj, depth) {
  let text = ''
  function convert(json, depth = 0) {
    let skipNextPadding = false
    const pad = txt => skipNextPadding ? (skipNextPadding = false, txt) : (' '.repeat(depth * 2) + txt)
    function processEntry(key, value, anon) {
      if (value[0] === 'option' && !skipNextPadding) { // skipNextPadding = switch
        key += `?`
        value = value[1]
      }
      if (typeof value === 'string') {
        text += pad(`${key}: ${value}\n`)
      } else if (Array.isArray(value)) {
        if (anon) {
          text += pad(`_:`)
        } else {
          text += pad(`${key}:`)
        }
        if (value[0] === 'container') {
          text += pad(`\n`)
          if (value[1].length === 0) {
            text += pad(`  # Empty\n`) // yaml doesn't support empty containers
          } else {
            convert(value[1], depth + 1)
          }
        } else if (value[0] === 'switch') {
          const sw = value[1]
          if (Object.keys(sw.fields).length === 0) {
            text += ` ${JSON.stringify(value)}\n` // yaml doesn't support empty switches
          } else {
            text += ` ${sw.compareTo} ?\n`
            for (const fieldName in sw.fields) {
              text += pad(`  if `)
              depth += 1
              skipNextPadding = true
              processEntry(fieldName, sw.fields[fieldName])
              depth -= 1
            }
          }
        } else if (value[0] === 'array') {
          const arr = value[1]
          const count = arr.count ? '$' + arr.count : arr.countType
          if (typeof arr.type === 'string') {
            text += ` ${arr.type}[]${count || ''}\n`
          } else if (arr.type[0] === 'container') {
            text += ` []${count || ''}\n`
            convert(arr.type[1], depth + 1)
          } else {
            text += ` []${count || ''}\n`
            depth += 1
            processEntry('', arr.type, true)
            depth -= 1
          }
        } else if (value[0] === 'mapper') {
          const map = value[1]
          text += ` ${map.type} =>\n`
          for (const key in map.mappings) {
            text += pad(`  ${key}: ${map.mappings[key]}\n`)
          }
        } else {
          let json = JSON.stringify(value, null, 2)
          json = json.replaceAll('\n', '\n' + ' '.repeat(depth * 2))
          text += ` ${json}\n`
        }
      }
    }
    if (Array.isArray(json)) {
      for (const entry of json) {
        processEntry(entry.name, entry.type, entry.anon)
      }
    } else for (let key in json) {
      const value = json[key]
      processEntry(key, value)
    }
  }
  convert(obj, depth)
  return text
}

module.exports = toYAML