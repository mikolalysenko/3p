'use strict'

module.exports = MeshEncoder

var sc               = require('simplicial-complex')
var heap             = require('./heap')
var computeNeighbors = require('./neighbors')

function extractEdges(cells) {
  var result = []
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var j=0; j<3; ++j) {
      var x = c[j]
      var y = c[(j+1)%3]
      var a = Math.min(x,y)
      var b = Math.max(x,y)
      result.push([a,b])
    }
  }
  return result
}

function CollapseEvent(i,j,error) {
  this.v0    = Math.min(i,j)|0
  this.v1    = Math.max(i,j)|0
  this.error = +error
  this.index = -1
}

function EdgeCollapse(s, t, lo, l, la, ro, r, ra) {
  this.s = s
  this.t = t
  this.leftOrientation = lo
  this.left = l
  this.leftAttributes = la
  this.rightOrientation = ro
  this.right = r
  this.rightAttributes = ra
}

function compareEdge(a,b) {
  var d = a[0] - b[0]
  if(d) {
    return d
  }
  return a[1] - b[1]
}

function compareInt(a,b) {
  return a - b
}

function MeshEncoder(cells, position, vAttributes, fAttributes) {
  //Vertex ranking data structure
  var numVertices   = position.length
  this.vertexLive   = new Array(numVertices)
  for(var i=0; i<numVertices; ++i) {
    this.vertexLive[i] = true
  }

  //Vertex data (positions and attributes)
  this.positions        = position.slice()
  this.vertexAttributes = vAttributes.map(function(attr) {
    return attr.slice()
  })

  //Edge & triangles
  this.cells      = cells.slice()
  this.cellAttributes = fAttributes.map(function(attr) {
    return attr.slice()
  })

  //Vertex <-> Triangle incidence
  this.stars = sc.dual(this.cells, numVertices)
  this.stars.forEach(function(s) {
    s.sort(compareInt)
  })

  //Vertex neighbors
  this.neighbors = new Array(numVertices)
  for(var i=0; i<numVertices; ++i) {
    this.neighbors[i] = computeNeighbors(
      this.cells,
      this.stars[i], 
      i)
  }

  //Enqueue pending edge collapse events
  var edges = extractEdges(this.cells)
  edges.sort(compareEdge)
  var collapse = new Array(edges.length)
  var edgeTable = {}
  for(var i=0; i<edges.length; ++i) {
    var e = edges[i]
    var c = collapse[i] = new CollapseEvent(e[0], e[1], this.edgeError(e[0], e[1]))
    edgeTable[e] = c
  }
  heap(collapse)

  this.edgeTable = edgeTable
  this.pendingCollapse = collapse
}

var proto = MeshEncoder.prototype

proto.edgeError = function(i,j) {
  //Check if collapsing edge will squish two faces together
  var a = Math.min(i,j)
  var b = Math.max(i,j)
  var nbhd0 = this.neighbors[a]
  var nbhd1 = this.neighbors[b]

  //Compute error of collapsing B
  var nbhdSize = nbhd0.length + nbhd1.length
  if(nbhdSize > 15) {
    return Infinity
  }

  //Vertices must have exactly 2 common neighbors
  var common = 0
  for(var i=0; i<nbhd0.length; ++i) {
    if(nbhd1.indexOf(nbhd0[i]) >= 0) {
      common += 1
    }
  }
  if(common !== 2) {
    return Infinity
  }
  if(nbhd0.length === 3 && nbhd1.length === 3) {
    return Infinity
  }

  //Favor collapsing vertices with small neighborhoods
  var nweight = nbhdSize * 1000 + Math.max(nbhd0.length,nbhd1.length)
  var vweight = a / this.positions.length
  return nweight + vweight
}

function remove(array, item) {
  array.splice(array.indexOf(item), 1)
}

//Recomputes an edge priority
proto.updateEdge = function(i,j) {
  var a = Math.min(i,j)
  var b = Math.max(i,j)

  //Compute edge error
  var error = this.edgeError(a,b)

  //Update tables
  var tok = a + ',' + b
  var event = this.edgeTable[tok]
  if(event) {
    heap.change(this.pendingCollapse, event, error)
  } else {
    event = new CollapseEvent(a, b, error)
    this.edgeTable[tok] = event
    heap.push(this.pendingCollapse, event)
  }
}

//Removes an old edge from the table
proto.removeEdge = function(i,j) {
  var a = Math.min(i,j)
  var b = Math.max(i,j)
  var tok = a + ',' + b
  var event = this.edgeTable[tok]
  if(event) {
    heap.remove(this.pendingCollapse, event)
    delete this.edgeTable[tok]
  }
}

proto.pop = function() {

  while(this.pendingCollapse.length > 0) {
    //Pop edge out of heap
    var next = heap.pop(this.pendingCollapse)
    if(!next) {
      return null
    }
    var v0 = next.v0
    var v1 = next.v1
    if(!this.vertexLive[v0] ||
       !this.vertexLive[v1] ||
       next.error >= Infinity) {
      this.removeEdge(v0, v1)
      continue
    }

    var error = this.edgeError(v0, v1)
    if(error === Infinity) {
      this.removeEdge(v0, v1)
      continue
    }

    if(error > next.error) {
      next.error = erro
      heap.push(this.pendingCollapse, next)
      continue
    }

    //Get triangle and edge data
    var star0 = this.stars[v0]
    var star1 = this.stars[v1]

    var nbhd0 = this.neighbors[v0]
    var nbhd1 = this.neighbors[v1]

    //Remove all events
    for(var i=0; i<nbhd1.length; ++i) {
      var v = nbhd1[i]
      this.removeEdge(v1, v)
    }

    //Compute left and right neighbors of edge
    var i0     = nbhd0.indexOf(v1)
    var n0     = nbhd0.length
    var left   = (i0 + n0 - 1) % n0
    var right  = (i0 + 1) % n0
    var leftV  = nbhd0[left]
    var rightV = nbhd0[right]
    var leftF  = -1
    var rightF = -1

    //Update stars
    for(var i=0; i<star1.length; ++i) {
      var f    = star1[i]
      var cell = this.cells[f]
      var i0   = cell.indexOf(v0)
      var i1   = cell.indexOf(v1)
      if(i0 < 0) {
        cell[i1] = v0
        star0.push(f)
      } else {
        remove(star0, f)
        if(cell.indexOf(leftV) >= 0) {
          leftF = f
          remove(this.stars[leftV], f)
        } else {
          rightF = f
          remove(this.stars[rightV], f)
        }
      }
    }
    star0.sort(compareInt)
    star1.length = 0

    var leftC = this.cells[leftF]
    var rightC = this.cells[rightF]

    var leftOrientation = leftC[(leftC.indexOf(v0)+1)%3] === v1
    var rightOrientation = rightC[(rightC.indexOf(v0)+1)%3] === v1

    //Clear out properties
    leftC[0] = leftC[1] = leftC[2] = 
    rightC[0] = rightC[1] = rightC[2] = -1

    //Update neighborhoods
    this.neighbors[v1]  = []
    nbhd0 = this.neighbors[next.v0] = computeNeighbors(
      this.cells,
      star0,
      next.v0)
    n0 = nbhd0.length
    for(var i=0; i<n0; ++i) {
      var v = nbhd0[i]
      this.neighbors[v] = computeNeighbors(
        this.cells,
        this.stars[v],
        v)
    }

    //Mark vertex v1 as dead
    this.vertexLive[v1] = false

    //Update collapse priorities
    for(var i=0; i<n0; ++i) {
      var v = nbhd0[i]
      this.updateEdge(v0, nbhd0[i])

      var nbhdv = this.neighbors[v]
      for(var j=0; j<nbhdv.length; ++j) {
        var u = nbhdv[j]
        this.updateEdge(u, v)
      }
    }
    
    //Compute cell attributes
    var fattr = this.cellAttributes
    var leftAttributes  = new Array(fattr.length)
    var rightAttributes = new Array(fattr.length)
    for(var i=0; i<fattr.length; ++i) {
      leftAttributes[i]  = fattr[i][leftF]
      rightAttributes[i] = fattr[i][rightF]
    }

    //Return resulting edge collapse
    return new EdgeCollapse(
      next.v0,
      next.v1,
      leftOrientation, nbhd0.indexOf(leftV), leftAttributes,
      rightOrientation, nbhd0.indexOf(rightV), rightAttributes)
  }

  return null
}

proto.base = function() {
  var vresult = []
  for(var i=0; i<this.vertexLive.length; ++i) {
    if(this.vertexLive[i]) {
      vresult.push(i)
    }
  }
  var fresult = []
  for(var i=0; i<this.cells.length; ++i) {
    var c = this.cells[i]
    for(var j=0; j<c.length; ++j) {
      if(!this.vertexLive[c[j]]) {
        break
      }
    }
    if(j === c.length) {
      fresult.push(i)
    }
  }
  return {
    verts: vresult,
    cells: fresult
  }
}