var testCodec = require('./test-codec')
var icos = require('conway-hart')('mC')

testCodec('icosahedron', icos.positions.length, icos.cells)