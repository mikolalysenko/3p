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

function MeshEncoder(
  numVertices, 
  numCells, 
  cells, 
  vAttributes, 
  fAttributes) {

  //Counting info
  this.numVertices  = numVertices
  this.numCells     = numCells

  //Vertex ranking data structure
  this.vertexLive   = new Array(numVertices)
  for(var i=0; i<numVertices; ++i) {
    this.vertexLive[i] = true
  }

  //Vertex data
  this.vertexAttributes = vAttributes

  //Cell data
  this.cells          = cells.slice()
  this.cellAttributes = fAttributes

  //Topology: Vertex <-> Triangle incidence
  this.stars = sc.dual(this.cells, numVertices)
  this.stars.forEach(function(s) {
    s.sort(compareInt)
  })

  //Topology: Vertex neighbors
  this.neighbors = new Array(numVertices)
  for(var i=0; i<numVertices; ++i) {
    this.neighbors[i] = computeNeighbors(
      this.cells,
      this.stars[i], 
      i)
  }

  //Build queue of edge collapse
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

  //Store data structure for edge collapse look up
  //and priority queue
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
  //Collapse in arbitrary order
  var nweight = nbhdSize * 1000 + Math.max(nbhd0.length,nbhd1.length)
  var vweight = a / this.numVertices
  return nweight + vweight
}

//Helper function:  remove item from array
function remove(array, item) {
  array.splice(array.indexOf(item), 1)
}

//Recomputes an edge priority
proto.updateEdge = function(i,j) {
  var a = Math.min(i,j)
  var b = Math.max(i,j)

  //Compute edge error
  var error = this.edgeError(a,b)

  //Update priority queue and table
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

  //Look up edge in table
  var tok = a + ',' + b
  var event = this.edgeTable[tok]
  if(event) {
    //Remove from priority queue and table
    heap.remove(this.pendingCollapse, event)
    delete this.edgeTable[tok]
  }
}

//Collapse an edge and pop out a vertex split operation
proto.pop = function() {
  while(this.pendingCollapse.length > 0) {
    //Get lowest error edge from heap
    var next = heap.pop(this.pendingCollapse)
    if(!next) {
      return null
    }

    //Check that edge is valid
    var v0 = next.v0
    var v1 = next.v1
    if(!this.vertexLive[v0] ||
       !this.vertexLive[v1] ||
       next.error >= Infinity) {
      this.removeEdge(v0, v1)
      continue
    }

    //Check that event is valid
    var error = this.edgeError(v0, v1)
    if(error === Infinity) {
      this.removeEdge(v0, v1)
      continue
    }

    //If error updated, then requeue edge
    if(error > next.error) {
      next.error = erro
      heap.push(this.pendingCollapse, next)
      continue
    }

    //Read in topology data for edge
    var star0 = this.stars[v0]
    var star1 = this.stars[v1]
    var nbhd0 = this.neighbors[v0]
    var nbhd1 = this.neighbors[v1]

    //Now we collapse v1 into v0:

    //Remove all edges incident to v1
    for(var i=0; i<nbhd1.length; ++i) {
      var v = nbhd1[i]
      this.removeEdge(v1, v)
    }

    //Glue neighborhood of v0 into v1, store result
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

//Construct an initial mesh from whatever is left
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