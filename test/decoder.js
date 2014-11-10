'use strict'

module.exports = testDecoder

var MeshDecoder      = require('../lib/decoder')
var computeNeighbors = require('../lib/neighbors')
var crunch           = require('../encode-json')

var tape = require('tape')

function reorder(nbhd, star, cells, vertex) {
  var result = new Array(star.length)
  for(var i=0; i<nbhd.length; ++i) {
    var a = nbhd[i]
    var b = nbhd[(i+nbhd.length-1)%nbhd.length]

    result[i] = -1

    for(var j=0; j<star.length; ++j) {
      var cell = cells[star[j]]
      if(cell.indexOf(a) >= 0 &&
         cell.indexOf(b) >= 0) {
        result[i] = star[j]
      }
    }
  }

  for(var i=0; i<star.length; ++i) {
    star[i] = result[i]
  }
}

function testDecoder(name, geometry) {
  tape('decode: ' + name, function(t) {
    var crunched = crunch(
      geometry.cells, 
      [geometry.positions])
    var initial = crunched.initialComplex
    
    var decoder = new MeshDecoder(
      initial.vertexCount,
      initial.vertexAttributes,
      initial.cells,
      initial.cellAttributes)

    function checkNeighborhood(v) {
      var star = decoder.stars[v]
      var nbhd = decoder.neighbors[v]
      
      console.log('checking vertex:', v, '---', star.map(function(f) {
        return decoder.cells[f]
      }).join(':'))

      t.equals(star.length, nbhd.length, 'star and nbhd length consistent: ' +
        nbhd.join() + " -- " + star.join())

      
      for(var i=0; i<nbhd.length; ++i) {
        var f = star[i]
        var u = nbhd[i]

        t.ok(nbhd[0] <= nbhd[i], 'neighborhood order ok')
        var w = nbhd[(i+nbhd.length-1)%nbhd.length]
        var c = decoder.cells[f]

        var cv = c.indexOf(v)
        var cu = c.indexOf(u)
        var cw = c.indexOf(w)

        t.ok(cv >= 0 && cu >= 0 && cw >= 0, 'cell valid: ' + c)
        t.equals((cu+2)%3, cv, 'check neighborhood in')
        t.equals((cu+1)%3, cw, 'check neighborhood out')
      }
    }

    function verifyMesh() {
      var numVerts = decoder.numVerts
      var numCells = decoder.cells.length

      /*
      t.equals(decoder.vertexAttributes.length, geometry.vertexAttributes.length, 'vattributes ok')
      t.equals(decoder.cellAttributes.length, geometry.cellAttributes.length, 'vattributes ok')
      */

      var stars = new Array(numVerts)
      for(var i=0; i<numVerts; ++i) {
        checkNeighborhood(i)
        stars[i] = []
      }

      for(var i=0; i<numCells; ++i) {
        var c = decoder.cells[i]
        for(var j=0; j<3; ++j) {
          t.ok(0 <= c[j] && c[j] < numVerts, 'valid cell: ' + i + ' -- ' + c.join())
          t.ok(c.indexOf(c[j]) === j, 'no degenerates')
          stars[c[j]].push(i)
        }
      }

      for(var i=0; i<numVerts; ++i) {
        stars[i].sort(function(a,b) {
          return a - b
        })
        var nbhd = computeNeighbors(
          decoder.cells,
          stars[i],
          i)
        t.same(decoder.neighbors[i].join(), nbhd.join(), 'neighborhood consistent v=' + i)
        t.equals(nbhd.length, stars[i].length, 'length ok')

        //Convert stars and neighborhoods
        reorder(nbhd, stars[i], decoder.cells, i)
        t.same(decoder.stars[i], stars[i], 'stars same')
      }
    }

    for(var i=0; i<crunched.vertexSplits.length; ++i) {
      console.log(decoder.cells.join(':'))
      verifyMesh()
      var vsplit = crunched.vertexSplits[i]
      decoder.vsplit(
        vsplit.baseVertex,
        vsplit.vertexAttributes,
        vsplit.left,
        vsplit.leftOrientation,
        vsplit.leftAttributes,
        vsplit.right,
        vsplit.rightOrientation,
        vsplit.rightAttributes)
    }

    verifyMesh()

    t.equals(decoder.numVerts, geometry.positions.length)
    t.equals(decoder.cells.length, geometry.cells.length)

    t.end()
  })
}