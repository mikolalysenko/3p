var testCodec = require('./test-codec')
var dragon = require('stanford-dragon/3')

testCodec('dragon', dragon.positions.length, dragon.cells)