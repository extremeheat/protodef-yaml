const compile = require('../compiler')
const fs = require('fs')
const crypto = require('crypto')

compile('./proto.yaml')

function sha1(file) {
    const data = fs.readFileSync(file);
    return crypto.createHash('sha1').update(data).digest("hex")
}

const hash = sha1('compiled_proto.json')
console.info('sha1', hash)
const expected = 'e9d05e6016079fa67e3c5a4090ae2921cfc09ec0'
if (hash !== expected) {
    console.error('Unexpected hash: ', hash, '!=', expected)
    throw Error('Unexpected hash')
} else {
    console.info('✔ ok')
}