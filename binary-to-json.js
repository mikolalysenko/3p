'use strict'

module.exports = convertBinaryToJSON

var MAGIC = '3PB\n'

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

var TYPE_SIZES = {
  'uint8':   1,
  'uint16':  2,
  'uint32':  4,
  'int8':    1,
  'int16':   2,
  'int32':   4,
  'float32': 4,
  'float64': 8
}

function computeTypeSize(typeInfo) {
  var size = 0
  for(var i=0; i<typeInfo.length; ++i) {
    size += typeInfo[i].count * TYPE_SIZES[typeInfo[i].type]
  }
  return size
}

function convertBinaryToJSON(buffer) {
  if(buffer.length < 4) {
    throw new Error('3p: invalid buffer')
  }
  for(var i=0; i<4; ++i) {
    if(buffer.readUInt8(i) !== MAGIC.charCodeAt(i)) {
      throw new Error('3p: invalid magic number')
    }
  }
  buffer = buffer.slice(4)

  function readAttributeTypes(attrCount) {
    var ptr = 0
    var typeInfo = []
    for(var i=0; i<attrCount; ++i) {
      if(buffer.length < ptr + 12) {
        throw new Error('3p: error reading attribute types, too small')
      }
      var count = buffer.readUInt32BE(ptr)
      var typeNo = buffer.readUInt32BE(ptr+4)
      var nameLength = buffer.readUInt32BE(ptr+8)

      //Check type code
      if(typeNo >= TYPE_CODES.length) {
        throw new Error('3p: invalid type number')
      }

      ptr += 12
      if(buffer.length < ptr + nameLength) {
        throw new Error('3p: error reading type name')
      }
      var name = buffer.slice(ptr, ptr+nameLength).toString('ascii')
      ptr += nameLength

      typeInfo.push({
        count: count,
        type:  TYPE_CODES[typeNo],
        name:   name
      })
    }
    buffer = buffer.slice(ptr)
    return typeInfo
  }

  function parseHeader() {
    if(buffer.length < 32) {
      throw new Error('3p: invalid header, too small')
    }

    //Skip splitOffset for now

    //Read in properties
    var majorVersion = buffer.readUInt32BE(4)
    var minorVersion = buffer.readUInt32BE(8)
    var patchVersion = buffer.readUInt32BE(12)
    var vertexCount  = buffer.readUInt32BE(16)
    var cellCount    = buffer.readUInt32BE(20)

    //Read attribute type info
    var vertexAttributeCount = buffer.readUInt32BE(24)
    var cellAttributeCount   = buffer.readUInt32BE(28)
    buffer = buffer.slice(32)
    var vertexAttributeTypes = readAttributeTypes(vertexAttributeCount)
    var cellAttributeTypes = readAttributeTypes(cellAttributeCount)

    return {
      version: [ majorVersion, minorVersion, patchVersion ].join('.'),
      vertexCount:          vertexCount,
      cellCount:            cellCount,
      vertexAttributeTypes: vertexAttributeTypes,
      cellAttributeTypes:   cellAttributeTypes
    }
  }

  var header = parseHeader()

  //Compute vertex attribute size and cell attribute size
  var vtypes = header.vertexAttributeTypes
  var vertexSize = computeTypeSize(vtypes)

  var ctypes = header.cellAttributeTypes
  var cellSize   = computeTypeSize(ctypes)

  function readAttributeValue(ptr, type) {
    var ftype = type.type
    var result = new Array(type.count)
    for(var i=0; i<type.count; ++i)
    switch(ftype) {
      case 'uint8':
        result[i] = buffer.readUInt8(ptr)
        ptr += 1
      break
      case 'uint16':
        result[i] = buffer.readUInt16BE(ptr)
        ptr += 2
      break
      case 'uint32':
        result[i] = buffer.readUInt32BE(ptr)
        ptr += 4
      break
      case 'int8':
        result[i] = buffer.readInt8(ptr)
        ptr += 1
      break
      case 'int16':
        result[i] = buffer.readInt16BE(ptr)
        ptr += 2
      break
      case 'int32':
        result[i] = buffer.readInt32BE(ptr)
        ptr += 4
      break
      case 'float32':
        result[i] = buffer.readFloatBE(ptr)
        ptr += 4
      break
      case 'float64':
        result[i] = buffer.readDobuleBE(ptr)
        ptr += 8
      break
    }
    if(type.count === 1) {
      return result[0]
    }
    return result
  }

  function readAttributeTable(ptr, index, types, values) {
    for(var i=0; i<types.length; ++i) {
      values[i][index] = readAttributeValue(ptr, types[i])
      ptr += types[i].count * TYPE_SIZES[types[i].type]
    }
    return ptr
  }

  function parseInitialComplex() {
    if(buffer.length < 8) {
      throw new Error('3p: missing size info for initialComplex')
    }

    var initialVertexCount = buffer.readUInt32BE(0)
    var initialCellCount   = buffer.readUInt32BE(4)

    if(buffer.length < 8 + 
      initialVertexCount * vertexSize +
      initialCellCount * (12 + cellSize)) {
      throw new Error('3p: initial complex truncated')
    }

    //Read vertex attributes
    var ptr = 8
    var vertexAttributes = new Array(vtypes.length)
    for(var i=0; i<vtypes.length; ++i) {
      vertexAttributes[i] = new Array(initialVertexCount)
    }
    for(var i=0; i<initialVertexCount; ++i) {
      ptr = readAttributeTable(ptr, i, vtypes, vertexAttributes)
    }

    //Read cells
    var cells = new Array(initialCellCount)
    for(var i=0; i<initialCellCount; ++i) {
      var cell = new Array(3)
      for(var j=0; j<3; ++j) {
        cell[j] = buffer.readUInt32BE(ptr)
        ptr += 4
      }
      cells[i] = cell
    }

    //Read cell attributes
    var cellAttributes = new Array(ctypes.length)
    for(var i=0; i<ctypes.length; ++i) {
      cellAttributes[i] = new Array(initialCellCount)
    }
    for(var i=0; i<initialCellCount; ++i) {
      ptr = readAttributeTable(ptr, i, ctypes, cellAttributes)
    }

    buffer = buffer.slice(ptr)

    return {
      vertexCount: initialVertexCount,
      cellCount: initialCellCount,
      cells: cells,
      vertexAttributes: vertexAttributes,
      cellAttributes: cellAttributes
    }
  }

  var initialComplex = parseInitialComplex()

  var splitSize = 6 + vertexSize + 2 * cellSize

  function readAttributeList(ptr, types) {
    var result = new Array(types.length)
    for(var i=0; i<types.length; ++i) {
      var type = types[i]
      result[i] = readAttributeValue(ptr, type)
      ptr += type.count * TYPE_SIZES[type.type]
    }
    return result
  }

  function parseVertexSplits() {
    var result = []
    var ptr = 0

    while(ptr + splitSize <= buffer.length) {

      var baseVertex = buffer.readUInt32BE(ptr)
      var leftV      = buffer.readUInt8(ptr+4)
      var rightV     = buffer.readUInt8(ptr+5)
      ptr += 6

      var battr = readAttributeList(ptr, vtypes)
      ptr += vertexSize

      var lattr = readAttributeList(ptr, ctypes)
      ptr += cellSize

      var rattr = readAttributeList(ptr, ctypes)
      ptr += cellSize

      var leftOrient  = leftV  >= 128
      var rightOrient = rightV >= 128
      var left        = leftV  & 0x7f
      var right       = rightV & 0x7f

      result.push({
        baseVertex: baseVertex,
        vertexAttributes: battr,
        left: left,
        leftOrientation: leftOrient,
        leftAttributes: lattr,
        right: right,
        rightOrientation: rightOrient,
        rightAttributes: rattr
      })
    }

    return result
  }

  var vertexSplits   = parseVertexSplits()

  return {
    header:         header,
    initialComplex: initialComplex,
    vertexSplits:   vertexSplits
  }
}