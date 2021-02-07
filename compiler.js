const fs = require('fs')
const yaml = require('js-yaml')

console.log = () => { }

function detectIndentation(lines) {
    const indentationLevel = 0
    for (var line of lines) {
        for (var c in line)
            if (c == ' ') { indentationLevel++ } else break
        if (indentationLevel) break
    }
    return indentationLevel
}

function getIndentation(line) {
    // console.log(line)
    let ind = 0
    for (var c of line) {
        if (c == ' ') ind++
        else break
    }
    return ind
}

function pad(indentation, line) {
    let ret = ''
    for (let i = 0; i < indentation; i++) ret += ' '
    return ret + line
}

// make valid yaml
function toYAML(file) {

    var imported = []
    function checkIfJson(key, val) { //  ¯\(°_o)/¯
        if (key.includes('"') || val.includes('[[') || val.includes('[{') || val.includes('{') || val.includes('}')) return true
        if (!val.includes('[]') && val.includes('[')) return true
        if (!val.includes('[]') && val.includes(']')) return true
        for (const c of ['[', ']', '{', '}']) if (key.includes(c)) return true
        return false
    }

    let data = fs.readFileSync(file, 'utf8')
    data = data.replace(/\t/g, '    ')
    const lines = data.split('\n')
    let modified = false

    function pars() {
        for (var i = 0; i < lines.length; i++) {
            let [key, val] = lines[i].trim().split(':', 2)
            if (key.startsWith('#')) continue
            key = key.trim(); val = val ? val.trim() : ''
            if (key == '_') key = '__' + i
            if (key.startsWith('!')) {

                if (key == '!import' && !imported.includes(val)) {
                    if (modified) {
                        throw Error('Incorrectly placed import, place it ontop of the file')
                    }
                    imported.push(val)
                    let imp = fs.readFileSync('./' + val, 'utf-8')
                    imp = imp.replace(/\t/g, '    ')
                    lines.splice(i, 0, ...imp.split('\n'))
                    return true
                }

                let nkey = key.replace('!', "'!"); nkey += "'";
                lines[i] = lines[i].replace(key, nkey)
            }

            if (checkIfJson(key, val)) {
                console.info('Ignoring JSON', lines[i])
                continue
            }

            console.log('i', i, val)
            let thisLevel = getIndentation(lines[i])
            let nextLevel = getIndentation(lines[i + 1] || '')
            console.log(thisLevel, nextLevel, nextLevel > thisLevel, val.trim())
            let isParent = nextLevel > thisLevel
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
                } else if (val.includes('?')) {
                    val = val.replace('?', '').trim()
                    lines[i] = pad(thisLevel, `"%switch,${key},${val}":`)
                } else if (val && !val.startsWith('#')) {
                    console.log(val)
                    throw Error(`Unexpected child block at line ${i}`)
                } else if (!key.startsWith('if')) {
                    lines[i] = pad(thisLevel, `"%container,${key},${val}":`)
                }
            } else {
                if (val.includes('[]')) {
                    const [type, countType] = val.split('[]')
                    lines[i] = pad(thisLevel, `"%array,${key},${type},${countType}":`)
                }
            }
        }

    }
    while (pars()) { console.info('Importing', imported[imported.length - 1]) }

    console.log(lines)
    // fs.writeFileSync(__dirname + '/inter.yaml', lines.join('\n'))
    return lines
}

function parseYAML(lines, outFile = 'inter.json') {
    yaml.loadAll(lines.join('\n'), function (doc) {
        console.log(doc)
        fs.writeFileSync(outFile, JSON.stringify(doc, null, 2))
    })
}

function transform(json, outFile) {
    json = json || require('./inter.json')

    while (recurse2(json) == 'updated') console.log('Updated.') // fix ../ switch compareTo variables

    ctx = []

    function visitArray(obj, name, countType, count, ctx) {
        console.log('OBJ', obj)
        if (countType.startsWith('$')) {
            count = countType.slice(1)
            countType = undefined
        }
        if (typeof obj == 'string') {
            if (name) {
                ctx.push({ name, type: ['array', { countType, count, type: obj }] })
            } else {
                ctx.push('array', { countType, count, type: obj })
            }
        } else {
            const len = Object.keys(obj).length
            const first = Object.keys(obj)[0]
            if (len == 1 && first.startsWith('%array') || first.startsWith('%switch')) { //remove container nested array
                if (name) {
                    const a = { countType, count, type: [] }
                    ctx.push({ name, type: ['array', a] })
                    trans(obj, a.type)
                    //   console.log('atn0-------',name,a.type)
                    if (!a.type[0].name || a.type[0].name.startsWith('__')) a.type = a.type[0].type
                } else {
                    const a = { countType, count, type: [] }
                    ctx.push('array', a)
                    trans(obj, a.type)
                    //   console.log('atn1',a.type)
                    if (!a.type[0].name || a.type[0].name.startsWith('__')) a.type = a.type[0].type
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
    }

    function trans(obj, ctx) {
        ctx = ctx || []
        for (var key in obj) {
            let val = obj[key]

            if (typeof val == 'object') {
                if (key.startsWith('%')) {
                    const args = key.split(',')
                    if (key.startsWith('%map')) {
                        const [, name, mappingType] = args
                        Array.isArray(ctx) ? ctx.push({
                            name,
                            type: [
                                'mapper',
                                {
                                    type: mappingType,
                                    mappings: val
                                }
                            ]
                        }) : null
                    } else if (key.startsWith('%switch')) {
                        let [, name, cmp] = args
                        let as = {}
                        let def = []
                        for (var _key in val) {
                            let _val = val[_key]
                            if (_key.startsWith('%array')) {
                                const [, name, type, countType] = _key.split(',')
                                const tokens = name.replace('if ', '').split('or')

                                for (var token of tokens) {
                                    token = token.trim()
                                    as[token] = typeof _val == 'string' ? _val : []
                                    // if (typeof _val == 'object') trans(_val, as[token])
                                    visitArray(_val, null, countType, undefined, as[token])
                                    if (token == 'default') {
                                        def = as[token]
                                        delete as[token]
                                    }
                                }
                            } else if (_key.startsWith('if')) {
                                const tokens = _key.replace('if ', '').split('or')
                                for (var token of tokens) {
                                    token = token.trim()
                                    as[token] = typeof _val == 'string' ? _val : ['container', []]
                                    if (typeof _val == 'object') trans(_val, as[token][1])
                                }
                            } else if (_key.includes('default')) {
                                def = []
                                if (typeof _val == 'object') {
                                    def = ['container', []]
                                    trans(_val, def[1])
                                }
                            }
                        }
                        let anon
                        if (name.startsWith('__')) { name = undefined; anon = true }

                        Array.isArray(ctx) ? ctx.push({
                            name,
                            anon,
                            type: [
                                'switch',
                                {
                                    compareTo: cmp.replace('?', ''),
                                    fields: as,
                                    default: def.length ? def : 'void'
                                }
                            ]
                        }) : null
                    } else if (key.startsWith('%array')) {
                        const [, name, type, countType] = args

                        console.log(val, typeof val, obj)
                        if (type && val && typeof val == 'object') throw Error('Array has a type and body: ' + name)

                        visitArray(val || type, name, countType, undefined, ctx)
                    } else if (key.startsWith('%container')) {
                        const [, cname] = args

                        const name = cname.startsWith('__') ? undefined : cname
                        const anon = undefined
                        if (!name) anon = true
                        ctx.push({ name, anon, type: ['container', []] })
                        trans(val, ctx[ctx.length - 1].type[1])
                    }
                } else {
                    // console.log(ctx)
                    // Probably JSON, leave as is
                }
            } else if (typeof val == 'string') {
                if (key.startsWith('!')) continue
                ctx.push({ name: key, type: val })
            }
            console.log(key, typeof val)
        }
    }

    trans(json, ctx)

    // add in json
    for (var key in json) {
        let val = json[key]
        if (typeof val == 'object' && !key.startsWith('%')) {
            console.log('pushing ext', { name: key, type: val })
            ctx.push({ name: key, type: val })
        }
    }

    // console.log('ctx', JSON.stringify(ctx, null, 2))
    fs.writeFileSync(outFile || 'compiled_proto.json', JSON.stringify(ctx, null, 2))
}

function getName(_key) {
    if (_key.startsWith('%')) {
        return _key.split(',')[1]
    }
    return _key
}

function rename(o, oldKey, newKey) {
    delete Object.assign(o, { [newKey]: o[oldKey] })[oldKey];
}

// add ../
function recurse2(obj) {
    for (const key in obj) {
        let val = obj[key]
        if (val && typeof val == 'object') {
            // console.log('.',obj, val)
            val.parent = () => obj
            val.key = () => key
            // val.visits = val.visits ? val.visits++ : 1
            recurse2(val)
        }

        if (key.startsWith('%switch')) {
            const [, name, switchVar] = key.replace('?', '').split(',')

            if (switchVar.startsWith('.')) continue

            let found = false
            for (const _key in obj) {
                let _name = _key
                if (_key.startsWith('%')) _name = _key.split(',')[1]
                if (_name == switchVar) found = true
            }

            if (!found) {
                console.log('Unknown switch variable:', switchVar)
            }


            let _obj = obj.parent?.()
            let depth = [obj.key?.()]
            while (!found && _obj.parent?.()) {
                depth.push(_obj.key())
                const _keys = Object.keys(_obj)
                for (let i = 0; i < _keys.length; i++) {
                    const _key = _keys[i]
                    const _val = _obj[_key]
                    const _name = getName(_key)
                    if (_name == switchVar) {
                        console.log(`Was found !`, _key)

                        console.log('Depth: ', depth)
                        const fil = depth.filter(e => !e.startsWith('if ') && getName(e) != 'default')
                        // console.log('De', fil)
                        let s = ''
                        for (var j = 0; j < fil.length - 1; j++) s += '../'
                        rename(obj, key, key.replace(switchVar, s + switchVar))
                        console.log('RENAME', obj, key, key.replace(switchVar, s + switchVar))
                        return 'updated'
                    }
                }

                _obj = _obj.parent()
            }
        }

    }
}



function formFinal(inp, out) {
    var j = require(inp || './compiled_proto.json')
    let ret = {}
    for (var entry of j) {
        ret[entry.name] = entry.type
    }
    fs.writeFileSync(out || './compiled_proto.json', JSON.stringify(ret, null, 2))
}


module.exports = (inputFile, outputFile) => {
    const temp = __dirname + '/inter.json'
    const out = __dirname + '/compiled_proto.json'
    parseYAML(toYAML(inputFile), temp)
    transform(require(temp), out)
    formFinal(out, outputFile)
}

if (!module.parent) {
    console.info('args ', process.argv)
    parseYAML(toYAML(process.argv[2] || './types.yaml'))
    transform()
    formFinal()
}