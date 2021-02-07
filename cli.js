#!/usr/bin/env node
const compile = require('./compiler')

if (!process.argv[2]) {
    console.warn('usage: protoyaml <inputYAML> [outputJSON]')
    console.warn('example: protoyaml proto.yaml protocol.json')

    const inp = process.argv[2]
    const out = process.argv[3] || inp

    compile(inp, out)
}