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
	assert.strictEqual(hash, '2cd08c609e734c8a914a46ec29540daf74907746')
})

it('transforms optionals to ProtoDef', function() {
	compile(f`opts.yml`, f`opts.json`)
	const hash = sha1(f`opts.json`)
	console.info('sha1 of optionals', hash)
	assert.strictEqual(hash, '3c24211c3b0ed22371104a0485277e607dc7b58b')
})

it('transforms mcpc with structuring carets to json', function() {
	compile(f`mcpc.yml`, f`mcpc.json`)
	const hash = sha1(f`mcpc.json`)
	console.info('sha1 of mcpc', hash)
	assert.strictEqual(hash, 'ae1814852484282be4bbfe13c132ad44e780b162')
})

it('transforms mcpc with structuring carets to html', function() {
    const intermediary = parse(f`mcpc.yml`, true)
    const html = genHTML(intermediary, { includeHeader: true, schemaSegmented: true })
	 fs.writeFileSync(f`mcpc.html`, html)
	assert(fs.readFileSync(f`mcpc.html`))
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

