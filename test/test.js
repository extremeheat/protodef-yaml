const compile = require('../compiler')
const fs = require('fs')
const crypto = require('crypto')

for (var file of ['file.yml', 'file2.yml']) {
    console.log('Testing ', file)
    compile(file)
    console.log('ok')
}

console.log('Testing proto.yml')

compile('./proto.yaml', './proto.json')

function sha1(file) {
    const data = fs.readFileSync(file);
    return crypto.createHash('sha1').update(data).digest("hex")
}

const hash = sha1('proto.json')
console.info('sha1', hash)
const expected = 'dc910b6e000fbd9a318110f3cc303c16e2d1aaea'
if (hash !== expected) {
    console.error('Unexpected hash: ', hash, '!=', expected)
    throw Error('Unexpected hash')
} else {
    console.info('✔ ok')
}

