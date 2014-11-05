'use strict'

module.exports = encodeBinary

var encodeJSON = require('./encode-json')
var toBinary   = require('./json-to-binary')

function encodeBinary(
  cells, 
  positions, 
  vertexAttributes, 
  cellAttributes) {
  return toBinary(encodeJSON(
    cells,
    positions,
    vertexAttributes,
    cellAttributes))
}