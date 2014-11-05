'use strict'

module.exports = MeshDecoder

//Somewhat messy helper function to compute the initial
//neighborhoods for each vertex (called at initialization)
function computeNeighborhood(cells, star, vertex) {
  if(star.length === 0) {
    return []
  }

  var nn = star.length

  var s0 = star[0]
  var c0 = cells[s0]
  var i0 = c0.indexOf(vertex)
  var v0 = c0[(i0 + 1) % 3]

  var result = new Array(nn)
  var rstar  = new Array(nn)
  result[0]  = v0
  rstar[0]   = s0
  for(var i=1; i<nn; ++i) {
    for(var j=0; j<nn; ++j) {
      var s1 = star[j]
      if(s1 === s0) {
        continue
      }
      var c1 = cells[s1]
      var i1 = c1.indexOf(vertex)
      if(c1[(i1+2)%3] === v0) {
        s0 = s1
        v0 = c1[(i1+1)%3]
        result[i] = v0
        rstar[i]  = s0
        break
      }
    }
  }

  //Extract k
  var k = 0
  var v = result[0]
  for(var i=1; i<nn; ++i) {
    var u = result[i]
    if(u < v) {
      k = i
      v = u
    }
  }

  //Shift so smallest item comes first
  var nresult = new Array(nn)
  for(var j=0; j<nn; ++j) {
    nresult[j] = result[(j+k)%nn]
    star[j]    = rstar[(j+k)%nn]
  }
  return nresult
}

//Construct all stars of a mesh
function buildStars(numVerts, cells) {
  var stars = new Array(numVerts)
  for(var i=0; i<numVerts; ++i) {
    stars[i] = []
  }
  var numCells = cells.length
  for(var i=0; i<numCells; ++i) {
    var f = cells[i]
    for(var j=0; j<3; ++j) {
      stars[f[j]].push(i)
    }
  }
  return stars
}

function shiftMin(array, star) {
  var minIndex = 0
  var v = array[0]
  var n = array.length
  for(var i=1; i<n; ++i) {
    var u = array[i]
    if(u < v) {
      minIndex = i
      v = u
    }
  }
  //TODO: Rewrite using fast shift algorithm
  var temp = new Array(n)
  for(var i=0; i<n; ++i) {
    temp[i] = array[(i+minIndex) % n]
  }
  for(var i=0; i<n; ++i) {
    array[i] = temp[i]
    temp[i] = star[(i+minIndex)  % n]
  }
  for(var i=0; i<n; ++i) {
    star[i] = temp[i]
  }
}

function MeshDecoder(
  positions,
  vertexAttributes,
  cells,
  cellAttributes) {
  
  this.positions            = positions
  this.vertexAttributes     = vertexAttributes
  this.cells                = cells
  this.cellAttributes       = cellAttributes

  //Topology data
  var numVerts   = positions.length
  var stars      = buildStars(numVerts, cells)
  this.stars     = stars
  this.neighbors = new Array(numVerts)
  for(var i=0; i<numVerts; ++i) {
    this.neighbors[i] = computeNeighborhood(
      cells,
      stars[i],
      i)
  }
}

var proto = MeshDecoder.prototype

proto.vsplit = function(
  s,
  position,
  attributes,
  leftI,  leftOrientation,  leftAttributes,
  rightI, rightOrientation, rightAttributes) {

  var t = this.positions.length

  //Append vertex data
  this.positions.push(position)
  var vattr = this.vertexAttributes
  var vc    = vattr.length
  for(var i=0; i<vc; ++i) {
    vattr[i].push(attributes[i])
  }

  //Read in nbhd and stars
  var nbhd  = this.neighbors[s]
  var star  = this.stars[s]
  var left  = nbhd[leftI]
  var right = nbhd[rightI]
  var nn    = nbhd.length

  //Create left and right faces
  var fattr  = this.cellAttributes
  var fc     = fattr.length

  //Append face attributes
  for(var i=0; i<fc; ++i) {
    fattr[i].push(leftAttributes[i], rightAttributes[i])
  }

  //Create left face
  var leftF  = this.cells.length
  var lnbhd  = this.neighbors[left]
  var lstar  = this.stars[left]
  var lsidx  = lnbhd.indexOf(s)
  var lfidx  = lsidx
  if(leftOrientation) {
    this.cells.push([left, s, t])
    lfidx = (lfidx + 1) % lnbhd.length
  } else {
    this.cells.push([left, t, s])
    lsidx = (lsidx + 1) % lnbhd.length
    lfidx = (lfidx + 1) % lnbhd.length
  }
  lnbhd.splice(lsidx, 0, t)
  lstar.splice(lfidx, 0, leftF)
  shiftMin(lnbhd, lstar)

  //Create right face
  var rightF = this.cells.length+1
  var rnbhd  = this.neighbors[right]
  var rstar  = this.stars[right]
  var rsidx  = rnbhd.indexOf(s)
  var rfidx  = rsidx
  if(rightOrientation) {
    this.cells.push([right, s, t])
    rfidx = (rfidx + 1) % rnbhd.length
  } else {
    this.cells.push([right, t, s])
    rsidx = (rsidx + 1) % rnbhd.length
    rfidx = (rfidx + 1) % rnbhd.length
  }
  rnbhd.splice(rsidx, 0, t)
  rstar.splice(rfidx, 0, rightF)
  shiftMin(rnbhd, rstar)
  
  //Split s neighborhood
  if(rightI > leftI) {
    leftI = leftI + nn
  }
  var snbhd = new Array(leftI-rightI+2)
  var sstar = new Array(leftI-rightI+2)
  snbhd[0]  = t
  sstar[0]  = leftF
  for(var i=rightI; i<=leftI; ++i) {
    snbhd[i-rightI+1] = nbhd[i%nn]
    sstar[i-rightI+1] = star[i%nn]
  }
  sstar[1]  = rightF
  shiftMin(snbhd, sstar)
  this.neighbors[s] = snbhd
  this.stars[s]     = sstar

  //Split t neighborhood
  leftI = leftI % nn
  if(leftI > rightI) {
    rightI += nn
  }
  var tstar = new Array(rightI-leftI+2)
  var tnbhd = new Array(rightI-leftI+2)
  tnbhd[0]  = s
  tstar[0]  = rightF
  for(var i=leftI; i<=rightI; ++i) {
    tnbhd[i-leftI+1] = nbhd[i%nn]
    tstar[i-leftI+1] = star[i%nn]
  }
  tstar[1]  = leftF
  shiftMin(tnbhd, tstar)
  this.neighbors.push(tnbhd)
  this.stars.push(tstar)

  //Fix up neighborhoods topology around t
  for(var i=0; i<tnbhd.length; ++i) {
    var v = tnbhd[i]
    if(!((v === left) || (v === right) || (v === s))) {
      var vnbhd = this.neighbors[v]
      vnbhd[vnbhd.indexOf(s)] = t
      shiftMin(vnbhd, this.stars[v])
    }
    var f = tstar[i]
    if(f !== leftF && f !== rightF) {
      var c = this.cells[f]
      c[c.indexOf(s)] = t
    }
  }
}
