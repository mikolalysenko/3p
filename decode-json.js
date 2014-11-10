'use strict'

module.exports = decodeJSON

var MeshDecoder = require('./lib/decoder')

function decodeJSON(json) {
  var initial = json.initialComplex
  var decoder = new MeshDecoder(
    initial.vertexCount,
    initial.vertexAttributes,
    initial.cells,
    initial.cellAttributes)

  var vsplits = json.vertexSplits
  for(var i=0; i<vsplits.length; ++i) {
    var vs = vsplits[i]
    decoder.vsplit(
      vs.baseVertex,
      vs.vertexAttributes,
      vs.left,
      vs.leftOrientation,
      vs.leftAttributes,
      vs.right,
      vs.rightOrientation,
      vs.rightAttributes)
  }

  return {
    cells:                decoder.cells,
    vertexAttributes:     decoder.vertexAttributes,
    cellAttributes:       decoder.cellAttributes,
    vertexAttributeTypes: json.header.vertexAttributeTypes,
    cellAttributeTypes:   json.header.cellAttributeTypes
  }
}