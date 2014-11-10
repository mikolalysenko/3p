'use strict'

module.exports = crunchMesh

var MeshEncoder = require('./lib/encoder')

var TYPE_CODES = [
  'uint8',
  'uint16',
  'uint32',
  'int8',
  'int16',
  'int32',
  'float32',
  'float64'
]

function guessTypes(attributes) {
  return attributes.map(function(attr, i) {
    //TODO: Test if attr is an ndarray or typedarray
    var x = attr[0]
    if(x) {
      return {
        name: 'attribute'+i,
        count: Array.isArray(x) ? x.length : 1,
        type: 'float64'
      }
    } else {
      return {
        name: 'attribute'+i,
        count: 1,
        type: 'float64'
      }
    }
  })
}

function maxVertex(cells) {
  var maxV = 0
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var j=0; j<3; ++j) {
      maxV = Math.max(maxV, c[j])
    }
  }
  return maxV
}

function convertTypes(types) {
  return types.map(function(type, i) {
    var name   = type.name || ('attribute' + i)
    var count  = type.count|0
    var tclass = type.type
    if(TYPE_CODES.indexOf(tclass) < 0) {
      throw new Error('3p: invalid type class ' + tclass)
    }
    return {
      name:  name,
      count: count,
      type:  tclass
    }
  })
}


function checkTypes(count, types, attributes) {
  if(types.length !== attributes.length) {
    throw new Error('3p: inconsistent attribute count')
  }
  for(var i=0; i<types.length; ++i) {
    var type = types[i]
    var attr = attributes[i]
    if(attr.length !== count) {
      throw new Error('3p: attribute length inconsistent')
    }

    //TODO: check attribute matches type description
  }
}

function crunchMesh(
  cells, 
  vattributes, 
  fattributes,
  vtypes,
  ftypes) {

  vattributes = vattributes || []
  fattributes = fattributes || []

  var numCells = cells.length
  var numVerts
  if(vattributes.length > 0) {
    numVerts = vattributes[0].length
  } else {
    numVerts = maxVertex(cells)
  }

  vtypes = convertTypes(vtypes || guessTypes(vattributes))
  ftypes = convertTypes(ftypes || guessTypes(fattributes))

  checkTypes(numVerts, vtypes, vattributes)
  checkTypes(numCells, ftypes, fattributes)

  var mesh = new MeshEncoder(
    numVerts,
    numCells,
    cells, 
    vattributes, 
    fattributes)

  var nbhdList = []

  var order = new Array(numVerts)
  var ecollapse = []
  var counter = numVerts-1
  while(true) {
    var c = mesh.pop()
    if(!c) {
      break
    }
    ecollapse.push(c)
    nbhdList.push(mesh.neighbors[c.s].slice())
    order[c.t] = counter--
  }

  var header = {
    version:              "1.0.0",
    vertexCount:          numVerts,
    cellCount:            numCells,
    vertexAttributeTypes: vtypes,
    cellAttributeTypes:   ftypes
  }

  //Get base mesh
  var base = mesh.base()

  //Convert into JSON format
  var initial = {
    vertexCount:      base.verts.length,
    cellCount:        base.cells.length,
    cells:            new Array(base.cells.length),
    cellAttributes:   new Array(ftypes.length),
    vertexAttributes: new Array(vtypes.length)
  }
  for(var i=0; i<vattributes.length; ++i) {
    initial.vertexAttributes[i] = new Array(base.vertexCount)
  }
  for(var i=0; i<fattributes.length; ++i) {
    initial.faceAttributes[i] = new Array(base.cellCount)
  }

  //Copy vertices
  for(var i=0; i<base.verts.length; ++i) {
    var v = base.verts[i]
    order[v] = counter--
    for(var j=0; j<vattributes.length; ++j) {
      initial.vertexAttributes[j][i] = vattributes[j][v]
    }
  }

  //Copy faces
  for(var i=0; i<base.cells.length; ++i) {
    var f = base.cells[i]
    var c = cells[f]
    var nf = new Array(3)
    for(var j=0; j<3; ++j) {
      nf[j] = order[c[j]]
    }
    initial.cells[i] = nf
    for(var j=0; j<fattributes.length; ++j) {
      initial.cellAttributes[j][i] = fattributes[j][f]
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

    var pnbhd = nbhdList[i]
    var onbhd = new Array(pnbhd.length)
    var k = 0
    for(var j=0; j<onbhd.length; ++j) {
      var u = order[pnbhd[j]]
      onbhd[j] = u
      if(u < onbhd[k]) {
        k = j
      }
    }

    var leftV  = order[pnbhd[e.left]]
    var rightV = order[pnbhd[e.right]]
    for(var j=0; j<onbhd.length; ++j) {
      pnbhd[j] = onbhd[(j+k) % onbhd.length]
    }

    vsplits.push({
      baseVertex:       order[e.s],
      vertexAttributes: vattr,
      left:             pnbhd.indexOf(leftV),
      leftOrientation:  e.leftOrientation,
      leftAttributes:   e.leftAttributes,
      right:            pnbhd.indexOf(rightV),
      rightOrientation: e.rightOrientation,
      rightAttributes:  e.rightAttributes
    })
  }

  //Return the resulting simplicial complex
  return {
    header: header,
    initialComplex: initial,
    vertexSplits: vsplits
  }
}