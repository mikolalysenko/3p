'use strict'

module.exports = crunchMesh

var Mesh = require('./lib/encoder')

function VertexSplit(
  vertex, 
  position, 
  attributes, 
  left,
  leftOrientation,
  leftAttributes,
  right,
  rightOrientation,
  rightAttributes) {
  this.vertex           = vertex
  this.position         = position
  this.attributes       = attributes
  this.left             = left
  this.leftOrientation  = leftOrientation
  this.leftAttributes   = leftAttributes
  this.right            = right
  this.rightOrientation = rightOrientation
  this.rightAttributes  = rightAttributes
}

function guessTypes(attributes) {
  return attributes.map(function(attr, i) {
    
  })
}

function crunchMesh(
  cells, 
  vattributes, 
  fattributes,
  vtypes,
  ftypes) {

  vattributes = vattributes || []
  fattributes = fattributes || []

  vtypes = vtypes || guessTypes(vattributes)
  ftypes = ftypes || guessTypes(fattributes)

  var mesh = new Mesh(
    cells, 
    positions, 
    vattributes, 
    fattributes)

  var numVerts = positions.length
  var order = new Array(numVerts)
  var ecollapse = []
  var counter = numVerts-1
  while(true) {
    var c = mesh.pop()
    if(!c) {
      break
    }
    ecollapse.push(c)
    order[c.t] = counter--
  }

  var header = {
    vertexCount: numVerts,
    vertexAttributeCount: vattributes.length,
    cellAttributeCount: fattributes.length
  }

  //Find all base vertices 
  var base = mesh.base()
  var initial = {
    positions: [],
    vertexAttributes: [],
    cells: [],
    cellAttributes: []
  }

  for(var i=0; i<vattributes.length; ++i) {
    initial.vertexAttributes.push([])
  }
  for(var i=0; i<fattributes.length; ++i) {
    initial.faceAttributes.push([])
  }

  //Construct base vertices
  for(var i=0; i<base.verts.length; ++i) {
    var v = base.verts[i]
    order[v] = i
    initial.positions.push(positions[v])
    for(var j=0; j<vattributes.length; ++j) {
      initial.vertexAttributes[j].push(vattributes[j][v])
    }
  }

  //Construct base faces
  for(var i=0; i<base.cells.length; ++i) {
    var f = base.cells[i]
    var c = cells[f]
    var nf = new Array(3)
    for(var j=0; j<3; ++j) {
      nf[j] = order[c[j]]
    }
    initial.cells.push(nf)
    for(var j=0; j<fattributes.length; ++j) {
      initial.cellAttributes[j].push(fattributes[j][f])
    }
  }

  //Construct vertex splits
  var vsplits = []
  for(var i=ecollapse.length-1; i>=0; --i) {
    var e = ecollapse[i]
    var vattr = []
    for(var j=0; j<vattributes.length; ++j) {
      vattr.push(vattributes[j][e.t])
    }

    vsplits.push(new VertexSplit(
      order[e.s],
      positions[e.t],
      vattr,
      e.left,
      e.leftOrientation,
      e.leftAttributes,
      e.right,
      e.rightOrientation,
      e.rightAttributes))
  }

  //Return the resulting simplicial complex
  return {
    header: header,
    initialComplex: initial,
    vertexSplits: vsplits
  }
}