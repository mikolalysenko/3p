'use strict'

module.exports = convertJSONtoBinary

function convertJSONtoBinary(json) {
  var header               = json.header
  var initialComplex       = json.initialComplex
  var vertexSplits         = json.vertexSplits

  var vertexAttributeCount = header.vertexAttributeCount
  var cellAttributeCount   = header.cellAttributeCount
}