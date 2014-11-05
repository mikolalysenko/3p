'use strict'

module.exports = convertJSONtoBinary

var MAGIC = '3PB\n'

var TYPE_SIZE = {
  'uint8':   1,
  'uint16':  2,
  'uint32':  4,
  'int8':    1,
  'int16':   2,
  'int32':   4,
  'float32': 4,
  'float64': 8
}

var TYPE_CODE = {
  uint8:      0
  uint16:     1
  uint32:     2
  int8:       3
  int16:      4
  int32:      5
  float32:    6
  float64:    7
}

function processTypes(types) {
  var offset = 0
  var result = []
  for(var i=0; i<types.length; ++i) {
    var size = types[i].count * TYPE_SIZE[types[i].type]
    result.push({
      offset:     offset,
      count:      types[i].count,
      size:       size,
      type:       types[i].type,
      name:       types[i].name
    })
    offset += size
  }
  return {
    types: result,
    size:  offset
  }
}

function convertJSONtoBinary(json) {
  var header               = json.header
  var initialComplex       = json.initialComplex
  var vertexSplits         = json.vertexSplits

  
  //Type info
  var vertexTypes = processTypes(header.vertexAttributeTypes)
  var cellTypes   = processTypes(header.cellAttributeTypes)
  
  //Compute size of header
  var headerOffset = 4
  var headerSize = 28
  vertexTypes.types.forEach(function(type) {
    headerSize += 12 + type.nameLength 
  })
  cellTypes.types.forEach(function(type) {
    headerSize += 12 + type.nameLength
  })

  //Compute size of initial cell complex
  var initialComplexOffset = headerOffset + headerSize
  var initialCellCount   = initialComplex.cellCount
  var initialVertexCount = initialComplex.vertexCount
  var initialComplexSize = 8 + 
        initialVertexCount * vertexTypes.size  +
        initialCellCount * (cellTypes.size + 12)

  //Compute size of vertex split list
  var splitSectionOffset = initialComplexOffset + initialComplexSize
  var splitSize = 6 + vertexTypes.size + 2 * cellTypes.size
  var splitSectionSize = vertexSplits.length * splitSize

  //Compute size of whole file
  var fileSize = 4 + headerSize + initialComplexSize + splitSectionSize

  function writeMagic(buffer) {
    for(var i=0; i<4; ++i) {
      buffer[i] = MAGIC.charCodeAt(i)
    }
  }

  function writeType(buffer, ptr, type) {
    buffer.writeUint32BE(type.count, ptr)
    ptr += 4
    buffer.writeUint32BE(TYPE_CODE[type.type], ptr)
    ptr += 4
    buffer.writeUint32(type.name.length, ptr)
    ptr += 4
    for(var j=0; j<type.name.length; ++j) {
      buffer.writeUint8(type.name.charCodeAt(j), ptr)
      ptr += 1
    }
    return ptr
  }

  function writeHeader(buffer) {
    var semverParts  = header.version.split('.')
    var majorVersion = semverParts[0]>>>0
    var minorVersion = semverParts[1]>>>0
    var patchVersion = semverParts[2]>>>0

    buffer.writeUint32BE(splitSectionOffset, 0)
    buffer.writeUint32BE(majorVersion, 4)
    buffer.writeUint32BE(minorVersion, 8)
    buffer.writeUint32BE(patchVersion, 12)
    buffer.writeUint32BE(header.vertexCount, 16)
    buffer.writeUint32BE(header.cellCount, 20)
    buffer.writeUint32BE(vertexTypes.types.length, 24)
    buffer.writeUint32BE(cellTypes.types.length, 28)

    var ptr = 32

    var vtypes = vertexTypes.types
    for(var i=0; i<vtypes.length; ++i) {
      ptr = writeType(buffer, ptr, vtypes[i].type)
    }

    var ctypes = cellTypes.types
    for(var i=0; i<ctypes.length; ++i) {
      ptr = writeType(buffer, ptr, ctypes[i].type)
    }
  }

  function writeAttribute(buffer, ptr, type, value) {
    var ftype = type.type
    var count = type.count
    if(count === 1) {
      value = [value]
    }
    for(var i=0; i<count; ++i)
    switch(ftype) {
      case 'uint8':
        buffer.writeUint8(value[i], ptr)
        ptr += 1
      break

      case 'uint16':
        buffer.writeUint16BE(value[i], ptr)
        ptr += 2
      break

      case 'uint32':
        buffer.writeUint32BE(value[i], ptr)
        ptr += 4
      break

      case 'int8':
        buffer.writeInt8(value[i], ptr)
        ptr += 1
      break

      case 'int16':
        buffer.writeInt16BE(value[i], ptr)
        ptr += 2
      break

      case 'int32':
        buffer.writeInt32BE(value[i], ptr)
        ptr += 4
      break

      case 'float32':
        buffer.writeFloatBE(value[i], ptr)
        ptr += 4
      break

      case 'float64':
        buffer.writeDoubleBE(value[i], ptr)
        ptr += 8
      break
    }
    return ptr
  }

  function writeInitialComplex(buffer) {
    buffer.writeUint32BE(initialVertexCount, 0)
    buffer.writeUint32BE(initialCellCount, 4)

    var ptr = 8
    var vtypes = vertexTypes.types
    var vattrs = initialComplex.vertexAttributes
    for(var i=0; i<initialVertexCount; ++i) {
      for(var j=0; j<vtypes.length; ++j) {
        ptr = writeAttribute(
          buffer, 
          ptr, 
          vtypes[j],
          vattrs[j][i])
      }
    }

    var cells = initialComplex.cells
    for(var i=0; i<initialCellCount; ++i) {
      var cell = cells[i]
      for(var j=0; j<3; ++j) {
        buffer.writeUint32BE(cell[j], ptr)
        ptr += 4
      }
    }

    var ctypes = cellTypes.types
    var cattrs = initialComplex.cellAttributes
    for(var i=0; i<initialVertexCount; ++i) {
      for(var j=0; j<ctypes.length; ++j) {
        ptr = writeAttribute(
          buffer,
          ptr,
          ctypes[j],
          cattrs[j][i])
      }
    }
  }

  function writeAttributeList(buffer, ptr, types, values) {
    for(var i=0; i<types.length; ++i) {
      ptr = writeAttribute(buffer, ptr, types[i], values[i])
    }
    return ptr
  }

  function writeVertexSplits(buffer) {
    var vtypes = vertexTypes.types
    var ctypes = cellTypes.types
    for(var i=0; i<vertexSplits.length; ++i) {
      var offset = i * splitSize
      var vsplit = vertexSplits[i]
      buffer.writeUint32BE(vsplit.baseVertex, offset)

      var lf = vsplit.leftOrientation ? 128 : 0
      buffer.writeUint8(vsplit.left + lf, offset+4)

      var rf = vsplit.rightOrientation ? 128 : 0
      buffer.writeUint8(vsplit.right + rf, offset+5)

      offset += 6

      offset = writeAttributeList(
        buffer, 
        offset, 
        vtypes, 
        vsplit.vertexAttributes)

      offset = writeAttributeList(
        buffer,
        offset,
        ctypes,
        vsplit.leftAttributes)

      offset = writeAttributeList(
        buffer,
        offset,
        ctypes,
        vsplit.rightAttributes)
    }
  }

  //Write out results
  var result = new Buffer(fileSize)
  writeMagic(result.slice(0,4))
  writeHeader(result.slice(headerOffset, headerOffset+headerSize))
  writeInitialComplex(result.slice(initialComplexOffset, initialComplexOffset+initialComplexSize))
  writeVertexSplits(result.slice(splitSectionOffset, splitSectionOffset+splitSectionSize))
  return result
}