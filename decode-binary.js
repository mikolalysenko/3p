'use strict'

module.exports = decodeBinary

var decodeJSON = require('./decode-json')
var toJSON = require('./binary-to-json')

function decodeBinary(buffer) {
  return decodeJSON(toJSON(buffer))  
}