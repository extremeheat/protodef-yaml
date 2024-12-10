/* eslint-env mocha */
const { parse, compile, genHTML } = require('../index')
const fs = require('fs')
const crypto = require('crypto')
const assert = require('assert')
const { join } = require('path')

const f = ([name]) => join(__dirname, 'files', name)

it('can transform basic JSON', function () {
  for (const file of [f`file.yml`, f`file2.yml`]) {
    console.log('Testing ', file)
    const json = compile(file)
    assert(json)
    console.log('ok', json)
  }
})

function sha1 (file) {
  const data = fs.readFileSync(file)
  return crypto.createHash('sha1').update(data).digest('hex')
}

it('transforms to ProtoDef', function () {
  compile(f`proto.yaml`, f`proto.json`)

  const hash = sha1(f`proto.json`)
  console.info('sha1', hash)
  assert.strictEqual(hash, 'c31e7a1ecf123f0a99c46851baf20aeef3e8960d')
})

it('transforms optionals to ProtoDef', function () {
  compile(f`opts.yml`, f`opts.json`)
  const hash = sha1(f`opts.json`)
  console.info('sha1 of optionals', hash)
  assert.strictEqual(hash, '3c8517a43bd5f84193be7cb47e1295ecfea77363')
})

it('transforms mcpc with structuring carets to json', function () {
  compile(f`mcpc.yml`, f`mcpc.json`)
  const hash = sha1(f`mcpc.json`)
  console.info('sha1 of mcpc', hash)
  assert.strictEqual(hash, '1c7cd4f9165662ca2cfc41ef0d4fa612e4be01f9')
})

it('transforms mcpc with structuring carets to html', function () {
  const intermediary = parse(f`mcpc.yml`, true)

  // Add additional information to the schema before passing to HTML gen
  function prepareMcpc (intermediary) {
    // fs.writeFileSync(f`__mcpc.json`, JSON.stringify(intermediary, null, 2))
    const updated = structuredClone(intermediary)
    for (const key in updated) {
      if (key.startsWith('%container,^')) {
        const region = key.split(',')[1].replace('^', '')
        const [status, direction] = region.split('.')
        const entries = updated[key]
        const packetMapper = entries['%container,packet,']
        if (packetMapper && packetMapper['%map,name,varint']) {
          const n = Object.entries(packetMapper['%map,name,varint'])
          const p = Object.fromEntries(Object.entries(packetMapper['%switch,params,name'] ?? {}).map(([k, v]) => [k.replace('if ', ''), v]))
          const packetMap = Object.fromEntries(n.map(([k, v]) => [p[v], k.split(',')[1]]))
          for (const k in entries) {
            if (k.startsWith('%container,')) {
              const [, name] = k.split(',')
              const id = parseInt(packetMap[name])
              entries[k]['!typedoc'] = `${status} / ${direction} / ${name}`
              if (isNaN(id)) {
                entries[k]['!id'] = packetMap[name]
              } else {
                const hex = '0x' + id.toString(16).padStart(2, '0')
                entries[k]['!id'] = id
                entries[k]['!typedoc'] += ` (${hex})`
              }
              entries[k]['!bound'] = direction === 'toServer' ? 'server' : 'client'
            }
          }
        }
      }
    }
    // fs.writeFileSync(f`__mcpc.json`, JSON.stringify(updated, null, 2))
    return updated
  }

  const updated = prepareMcpc(intermediary)
  const html = genHTML(updated, { includeHeader: true, schemaSegmented: true })
  fs.writeFileSync(f`mcpc.html`, html)
  assert(fs.readFileSync(f`mcpc.html`))
})

it('works inline', function () {
  const json = compile({
    main: 'x: bool\n!import: import.yml',
    'import.yml': 'y: bool'
  })
  assert(json)
})

it('transforms to HTML', function () {
  const intermediary = parse(f`proto.yaml`, true)
  // console.log('i', intermediary)
  const html = genHTML(intermediary)
  fs.writeFileSync(f`doc.html`, html)

  assert(fs.readFileSync(f`doc.html`))
})
