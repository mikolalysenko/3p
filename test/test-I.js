var testCodec = require('./test-codec')
var icos = require('conway-hart')('I')

testCodec('icosahedron', 20, icos.cells)