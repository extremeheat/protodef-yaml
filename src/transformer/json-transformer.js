const { log, getName } = require('../utils/string-utils')

function transform (json) {
  // console.log(json)
  const ctx = []

  function visitArray (obj, name, countType, count, ctx) {
    log('OBJ', obj)
    if (countType.startsWith('$')) {
      count = countType.slice(1)
      if (count.length && (count == parseInt(count))) count = parseInt(count) // eslint-disable-line eqeqeq
      countType = undefined
    }
    if (typeof obj === 'string') {
      if (name) {
        ctx.push({ name, type: ['array', { countType, count, type: obj }] })
      } else {
        ctx.push('array', { countType, count, type: obj })
      }
    } else {
      const k = Object.keys(obj).filter(k => !k.startsWith('!'))
      const len = k.length
      const first = k[0]
      // Try to inline switch/array inside an array if only 1 item inside
      // log('F', first, name, Object.keys(obj), first.startsWith('%array'))
      if ((len === 1) && (first.startsWith('%array') || first.startsWith('%switch'))) { // remove container nested array
        if (name) {
          const a = { countType, count, type: [] }
          ctx.push({ name, type: ['array', a] })
          trans(obj, a.type)
          //   log('atn0-------',name,a.type)
          if (!a.type[0].name || a.type[0].name.startsWith('__')) a.type = a.type[0].type
          else a.type = ['container', [a.type[0]]]
        } else {
          const a = { countType, count, type: [] }
          ctx.push('array', a)
          trans(obj, a.type)
          //   log('atn1',a.type)
          if (!a.type[0].name || a.type[0].name.startsWith('__')) a.type = a.type[0].type
          else a.type = ['container', [a.type[0]]]
        }
      } else {
        if (name) {
          const a = { countType, count, type: ['container', []] }
          ctx.push({ name, type: ['array', a] })
          trans(obj, a.type[1])
        } else {
          const a = { countType, count, type: ['container', []] }
          ctx.push('array', a)
          trans(obj, a.type[1])
        }
      }
    }
    if (name && name.endsWith('?')) {
      const pushed = ctx[ctx.length - 1]
      if (pushed.type) {
        pushed.name = pushed.name.slice(0, -1)
        pushed.type = ['option', pushed.type]
      }
    }
  }

  function trans (obj, ctx) {
    ctx = ctx || []

    function ctxPush (data) {
      if (data.name && data.name.endsWith('?')) {
        data.name = ctx.push({ ...data, name: data.name.slice(0, -1), type: ['option', data.type] })
      } else {
        ctx.push(data)
      }
    }

    for (const key in obj) {
      let val = obj[key]
      if (key.startsWith('!')) continue

      if (Array.isArray(val) && !key.startsWith('%')) { // pass thru protodef json
        if (key.startsWith('__')) ctxPush({ anon: true, type: val })
        else ctxPush({ name: key, type: val })
      } else if (typeof val === 'object') {
        if (key.startsWith('%')) {
          const args = key.split(',')
          if (key.startsWith('%map')) {
            const mappings = {}
            const [, name, mappingType, valueType] = args
            if (!mappingType) continue
            val = val || json['%map,' + valueType + ',']
            for (const i in val) {
              if (i.startsWith('!')) continue
              const _i = i.startsWith('%') ? i.split(',')[1] : i
              mappings[_i] = val[i] // Ignore comments + encapsulated numbers
            }
            ctxPush({
              name,
              type: [
                'mapper',
                {
                  type: mappingType,
                  mappings
                }
              ]
            })
          } else if (key.startsWith('%switch')) {
            let [, name, cmp] = args
            const as = {}
            let def = []
            for (const _key in val) {
              const _val = val[_key]
              const _keyName = getName(_key)
              if (_key.startsWith('%array')) {
                const [, name, type, countType] = _key.split(',')
                const tokens = name.replace('if ', '').split(' or ')

                for (let token of tokens) {
                  token = token.trim()
                  if (Array.isArray(_val)) {
                    as[token] = _val // inline ProtoDef JSON ; no parsing needed
                  } else {
                    as[token] = typeof _val === 'string' ? _val : []
                    visitArray(_val || type, null, countType, undefined, as[token])
                  }
                  if (token === 'default') {
                    def = as[token]
                    delete as[token]
                  }
                }
              } else if (_keyName.startsWith('if')) {
                const tokens = _keyName.replace('if ', '').split(' or ')
                for (let token of tokens) {
                  token = token.trim()
                  if (Array.isArray(_val) && !_key.startsWith('%')) {
                    as[token] = _val // inline ProtoDef JSON ; no parsing needed
                    continue
                  }
                  as[token] = typeof _val === 'string' ? _val : ['container', []]
                  if (typeof _val === 'object') {
                    if (_key.startsWith('%switch') || _key.startsWith('%map')) {
                      trans({ [_key]: _val }, as[token][1])
                      as[token] = as[token][1][0].type
                    } else {
                      trans(_val, as[token][1])
                    }
                  } else {
                    if (_val.startsWith('[')) {
                      as[token] = JSON.parse(_val)
                    }
                  }
                }
              } else if (_keyName.startsWith('default')) {
                def = []
                if (Array.isArray(_val) && !_key.startsWith('%')) {
                  def = _val // inline ProtoDef JSON ; no parsing needed
                } else if (typeof _val === 'object') {
                  def = ['container', []]
                  if (_key.startsWith('%switch') || _key.startsWith('%map')) {
                    trans({ [_key]: _val }, def[1])
                    def = def[1][0].type
                  } else {
                    trans(_val, def[1])
                  }
                } else {
                  def = _val
                  if (_val.startsWith('[')) {
                    def = JSON.parse(_val)
                  }
                }
              }
            }
            let anon
            if (name.startsWith('__')) { name = undefined; anon = true }

            ctxPush({
              name,
              anon,
              type: [
                'switch',
                {
                  compareTo: cmp.replace('?', ''),
                  fields: as,
                  default: def.length ? def : undefined
                }
              ]
            })
          } else if (key.startsWith('%array')) {
            const [, name, type, countType] = args

            log(val, typeof val, obj)
            if (type && val && typeof val === 'object') throw Error('Array has a type and body: ' + name)

            visitArray(val || type, name, countType, undefined, ctx)
          } else if (key.startsWith('%container')) {
            const [, cname] = args

            const name = cname.startsWith('__') ? undefined : cname
            let anon
            if (!name) anon = true
            const o = { name, anon, type: ['container', []] }
            trans(val, o.type[1])
            ctxPush(o)
          }
        } else {
          // log(ctx)
          // Probably JSON, leave as is
        }
      } else if (typeof val === 'string') {
        if (key.startsWith('!')) continue
        if (val.startsWith('[')) {
          val = JSON.parse(val)
        }
        ctxPush({ name: key, type: val })
      }
      log(key, typeof val)
    }
  }

  trans(json, ctx)

  // add in json
  for (const key in json) {
    const val = json[key]
    if (typeof val === 'object' && !key.startsWith('%')) {
      log('pushing ext', { name: key, type: val })
      ctx.push({ name: key, type: val })
    }
  }

  // log('ctx', JSON.stringify(ctx, null, 2))
  // fs.writeFileSync(outFile || 'compiled_proto.json', JSON.stringify(ctx, null, 2))
  return ctx
}

function formFinal (inp, out) {
  const ret = {}
  for (const entry of inp) {
    ret[entry.name] = entry.type
  }
  // fs.writeFileSync('./compiled_proto.json', JSON.stringify(ret, null, 2))
  return ret
}

function applyStructuringTf (obj, decontainerize = true) {
  // move ^path.to.final -> {path:{to:{final}}} and decontainerize
  const json = structuredClone(obj)
  for (const key in json) {
    const val = json[key]
    if (key.startsWith('^')) {
      const decontainerized = decontainerize ? Object.fromEntries(Object.values(val[1]).map((e) => [e.name, e.type])) : val
      const slices = key.slice(1).split('.')
      let node = json
      let lastSlice
      let lastNode
      for (const slice of slices) {
        node[slice] = node[slice] || {}
        lastNode = node
        lastSlice = slice
        node = node[slice]
      }
      lastNode[lastSlice] = decontainerized
      delete json[key]
    }
  }
  return json
}

module.exports = {
  transform,
  formFinal,
  applyStructuringTf
}
