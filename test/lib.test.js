const { parse, compile, genHTML } = require('../index')
const fs = require('fs')
const crypto = require('crypto')
const assert = require('assert')
const { join } = require('path')

const f = ([name]) => join(__dirname, 'files', name)

it('can transform basic JSON', function () {
	for (var file of [f`file.yml`, f`file2.yml`]) {
		console.log('Testing ', file)
		const json = compile(file)
		assert(json)
		console.log('ok', json)
	}
})

function sha1(file) {
   const data = fs.readFileSync(file);
   return crypto.createHash('sha1').update(data).digest("hex")
}

it('transforms to ProtoDef', function() {
	compile(f`proto.yaml`, f`proto.json`)

	const hash = sha1(f`proto.json`)
	console.info('sha1', hash)
	assert.strictEqual(hash, 'ac2f3030e3f89cd283e7b7bbbcea369a32db85fe')
})

it('transforms optionals to ProtoDef', function() {
	compile(f`opts.yml`, f`opts.json`)
	const hash = sha1(f`opts.json`)
	console.info('sha1 of optionals', hash)
	assert.strictEqual(hash, '3c24211c3b0ed22371104a0485277e607dc7b58b')
})

it('works inline', function () {
	const json = compile({
		'main': 'x: bool\n!import: import.yml',
		'import.yml': 'y: bool'
	})
	assert(json)
})

it('transforms to HTML', function() {
    const intermediary = parse(f`proto.yaml`, true)
    // console.log('i', intermediary)
    const html = genHTML(intermediary)
	 fs.writeFileSync(f`doc.html`, html)
	 
	assert(fs.readFileSync(f`doc.html`))
})

