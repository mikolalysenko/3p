'use strict'

module.exports = testEncoder

var MeshEncoder = require('../lib/encoder')
var tape = require('tape')
var sc = require('simplicial-complex')
var computeNeighbors = require('../lib/neighbors')

function heapParent(i) {
  if(i & 1) {
    return (i - 1) >> 1
  }
  return (i >> 1) - 1
}

function testEncoder(name, data, step) {
  tape('encode: ' + name, function(t) {
    var mesh = new MeshEncoder(
      data.positions.length,
      data.cells.length,
      data.cells,
      [data.positions],
      [])

    t.equals(mesh.numVertices, data.positions.length)
    t.equals(mesh.numCells, data.cells.length)

    step = step||0

    function computeEdges() {
      var edges = []
      for(var i=0; i<data.cells.length; ++i) {
        var c = data.cells[i]
        if(c[0]<0 || c[1]<0 || c[2]<0) {
          continue
        }
        for(var j=0; j<3; ++j) {
          var a = c[j]
          var b = c[(j+1)%3]
          var x = Math.min(a,b)
          var y = Math.max(a,b)
          edges.push([x,y])
        }
      }
      edges.sort(function(a,b) {
        var d = a[0] - b[0]
        if(d) {
          return d
        }
        return a[1] - b[1]
      })
      var ptr = 0
      for(var i=0; i<edges.length; ++i) {
        if(i>0 && edges[i] === edges[i-1]) {
          continue
        }
        edges[ptr++] = edges[i]
      }
      edges.length = ptr
      return edges
    }

    var numVertices = data.positions.length
    var count = 0
    function checkTopology() {
      if(--count > 0) {
        return
      }

      count = step
      var stars = new Array(numVertices)
      for(var i=0; i<numVertices; ++i) {
        stars[i] = []

        var lnbhd = mesh.neighbors[i]
        for(var j=0; j<lnbhd.length; ++j) {
          t.ok(mesh.vertexLive[lnbhd[j]], 'neighbors live')
        }
      }
      for(var j=0; j<mesh.cells.length; ++j) {
        var c = mesh.cells[j]
        for(var i=0; i<c.length; ++i) {
          if(c[i] >= 0) {
            stars[c[i]].push(j)
          }
        }
      }

      for(var i=0; i<numVertices; ++i) {
        var nbhd = computeNeighbors(
          mesh.cells, 
          stars[i], 
          i)
        t.same(mesh.stars[i], stars[i], 'stars for ' + i)
        t.same(mesh.neighbors[i], nbhd, 'neighbors for ' + i)
        for(var j=0; j<nbhd.length; ++j) {
          var v = nbhd[j]
          var count = 0
          for(var k=0; k<nbhd.length; ++k) {
            if(nbhd[k] === v) {
              count += 1
            }
          }
          t.equals(count, 1, 'neighborhood unique ' + v + ' - ' + nbhd.join())
          t.ok(mesh.neighbors[v].indexOf(i) >= 0, 'linked')
        }
      }

      var edges = computeEdges()
      var table = {}
      for(var i=0; i<edges.length; ++i) {
        table[edges[i]] = true
        var ec = mesh.edgeTable[edges[i].join()]
        if(ec) {
          t.equals(ec.v0, edges[i][0], 'check first vertex')
          t.equals(ec.v1, edges[i][1], 'check second vertex')
          t.equals(ec.error, mesh.edgeError(edges[i][0], edges[i][1]), 'check error')
          t.equals(mesh.pendingCollapse[ec.index], ec, 'checking heap location')
        }
      }

      /*
      //TODO: Filter out non-manifold edges
      var key0 = Object.keys(table)
      key0.sort()
      var key1 = Object.keys(mesh.edgeTable)
      key1.sort()
      t.same(key1, key0, 'check keys match')
      */

      //Check heap
      for(var i=1; i<mesh.pendingCollapse.length; ++i) {
        t.equals(mesh.pendingCollapse[i].index, i, 'index ok')
        t.ok(mesh.pendingCollapse[i].error >= mesh.pendingCollapse[heapParent(i)].error, 'heap invariant ' + i + ' vs ' + heapParent(i))
      }
    }

    checkTopology(mesh)

    var fcount = mesh.cells.length
    while(true) {
      var prevNeighbors = mesh.neighbors.map(function(nbhd) {
        return nbhd.slice()
      })
      var prevCells = mesh.cells.map(function(cell) {
        return cell.slice()
      })
      var prevStars = mesh.stars.map(function(star) {
        return star.slice()
      })
      var ecol = mesh.pop()
      if(!ecol) {
        break
      }

      var es = ecol.s
      t.ok(0 <= es && prevNeighbors[es].length > 0, 'check s valid')

      var et = ecol.t
      t.ok(0 <= et && prevNeighbors[et].length > 0, 'check t valid')

      t.ok(prevNeighbors[es].indexOf(et) >= 0, 'check linked s->t')
      t.ok(prevNeighbors[et].indexOf(es) >= 0, 'check linked t->s')

      var el = ecol.left
      t.ok(0 <= el && el < mesh.stars[es].length, 'check left valid')

      var er = ecol.right
      t.ok(0 <= er && er < mesh.stars[es].length, 'check left valid')

      var estar = prevStars[es]
      var enbhd = mesh.neighbors[es]

      var lv = enbhd[el]
      var rv = enbhd[er]
      var rf = -1
      var lf = -1
      for(var i=0; i<estar.length; ++i) {
        var f = estar[i]
        var cell = prevCells[f]
        if(cell.indexOf(et) >= 0) {
          if(cell.indexOf(lv) >= 0) {
            lf = f
          } else if(cell.indexOf(rv) >= 0) {
            rf = f
          }
        }
      }
      if(lf < 0) {
        t.fail('missing left face')
      } else {
        t.pass('left face ok')
      }
      if(rf < 0) {
        t.fail('missing right face: ' + JSON.stringify(ecol) + ' -- ' + rv)
      } else {
        t.pass('right face ok')
      }

      checkTopology(mesh)
    }

    count = 0
    checkTopology(mesh)

    t.end()
  })
}