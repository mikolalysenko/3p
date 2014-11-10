'use strict'

module.exports = testCodec

var tape = require('tape')
var encodeJSON = require('../encode-json')
var decodeJSON = require('../decode-json')

function getPermutation(tags) {
  var zipped = tags.map(function(t,i) {
    return [t, i]
  })
  zipped.sort(function(a,b) {
    return a.t - b.t
  })
  return zipped.map(function(pair) {
    return pair[1]
  })
}

function canonicalizeCells(cells, tags) {
  
  var perm = getPermutation(tags)
  var ncells = cells.map(function(cell) {
    var c = [
      perm[cell[0]],
      perm[cell[1]],
      perm[cell[2]]
    ]
    var k=0
    for(var i=0; i<3; ++i) {
      if(cell[i] < cell[k]) {
        k = i
      }
    }
    return [
      cell[k],
      cell[(k+1)%3],
      cell[(k+2)%3]
    ]
  })
}

function testCodec(name, numVerts, cells)  {
  tape('test codec: ' + name, function(t) {
    
    var vertexLabels = new Array(numVerts)
    for(var i=0; i<numVerts; ++i) {
      vertexLabels[i] = i
    }
    var ecells = canonicalizeCells(cells, vertexLabels)

    var threep = encodeJSON(cells, [vertexLabels])

    //TODO: Run integritry checks on data

    var decoded = decodeJSON(threep)

    //Check decoded mesh equivalent to input mesh
    var rcells = canonicalizeCells(decoded.cells, decoded.vertexAttributes[0])

    t.same(rcells, ecells, 'meshes should be identical')
    t.end()
  })
}