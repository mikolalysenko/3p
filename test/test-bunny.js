var testCodec = require('./test-codec')
var bunny = require('bunny')

testCodec('bunny', bunny.positions.length, bunny.cells)