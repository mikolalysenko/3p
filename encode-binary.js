'use strict'

module.exports = encodeBinary

var encodeJSON = require('./encode-json')
var toBinary   = require('./json-to-binary')

function encodeBinary(
  cells, 
  vertexAttributes, 
  cellAttributes,
  vertexAttributeTypes,
  cellAttributeTypes) {
  return toBinary(encodeJSON(
    cells,
    vertexAttributes,
    cellAttributes,
    vertexAttributeTypes,
    cellAttributeTypes))
}