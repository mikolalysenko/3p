3p: Progressive Triangle Streams
================================

**DRAFT SPECIFICATION**

Progressive triangle streams are an implementation of [Hugh Hoppe's progressive meshes](http://research.microsoft.com/en-us/um/people/hoppe/proj/pm/) with some minor modifications favoring file sizes and fast lossless decoding over visual fidelity.

This module provides documentation of progressive triangle streams as well as reference codecs for the binary and JSON formats. Optimized streaming decoders for specific applications are provided by other packages.

## Other implementations

* TODO

# Format description

Progressive triangle streams encode 3D triangulated meshes as a sequence of vertex split operations. Progressive triangle streams can have any number of vertex and/or face attributes, and can be truncated to produce approximations of the initial geometry. Progressive triangle streams support two distinct formats: a reference JSON format for debugging and a binary format.

Each 3P file consists of 3 sections with the following data:

* The file header, storing:
    + `version` - a string representing the version of the 3P file in semantic versioning format
    + `vertexCount` - the number of vertices in the stream
    + `vertexAttributeTypes` - an array of types for each vertex attribute
    + `cellAttributeTypes` - an array of types for each cell attribute
* An initial triangulated mesh, with 4 arrays:
    + `positions` - an array of 3 tuples of floats storing the vertex positions
    + `cells` - an array of 3 tuples of integers representing the vertex indices for each triangle
    + `vertexAttributes` - an array of arrays of vertex attributes
    + `cellAttributes` - an array of arrays of cell attributes
* An array of vertex split operations, each having the following properties:
    + `baseVertex` - the vertex to split
    + `attributes` - attributes for newly created vertex
    + `left` - index of left vertex in 1-ring around base vertex
    + `leftOrientation` - orientation of left face
    + `leftAttributes` - attributes for left face
    + `right` - index of right face
    + `rightOrientation` - orientation of right face
    + `rightAttributes` - attributes for right face

Each type declaration should have the following data:

* `name` which is the name of the type
* `count` which is the size of the type value
* `type` a string encoding the type of the attribute

## JSON format (.3PJ)

The JSON format for a progressive triangle stream contains the same data as above.  Each `3P` JSON object has 3 fields with the following data:

* `header`
* `initialComplex`
* `vertexSplits`

JSON formatted progressive triangle streams should use the file extension .3PJ

## Binary format (.3PB)

* Network byte order
* Magic number is `".3PB"`
* Should use extension .3PB

```
struct S3PBFile {
  uint32             magic
  S3PBHeader         header
  S3PBComplex        initialComplex
  S3PBVertexSplit[]  vertexSplits
}

struct S3PBHeader {
  uint32             majorVersion
  uint32             minorVersion
  uint32             patchVersion
  uint32             vertexCount
  S3PBAttribute[]    vertexAttributeTypes
  S3PBAttribute[]    cellAttributeTypes
}

struct S3PBAttribute {
  uint32             nameLength
  char[]             name
  uint32             count
  S3PBAttributeType  type
}

enum S3PBAttributeType: uint8 {
  uint8:      0
  uint16:     1
  uint32:     2
  int8:       3
  int16:      4
  int32:      5
  float32:    6
  float64:    7
}

struct S3PBComplex {
  uint32             initialVertexCount
  uint32             initialCellCount
  VertexAttribute[]  vertexAttributes
  uint32[3][]        cells
  CellAttribute[]    cellAttributes
}

struct S3PBVertexSplit {
  uint32             baseVertex
  uint8              left
  uint8              right
  VertexAttribute    attributes
  CellAttribute      leftAttributes
  CellAttribute      rightAttributes
}
```

## Notes

* Encoders must not collapse edges incident to non-manifold or boundary vertices 
* Vertices with more than 15 neighbors must not be split
* Encoders should prioritize edge collapses with minimal visual impact on images
* Binary decoders should gracefully handle truncated input
* Encoders may not preserve the index of each vertex.  Encoding/decoding may permute the order of cells/vertices in the mesh.
* Encoding must preserve topology and all attributes
* Codecs may collapse vertices in any order subject to the implementation

## Future

The following features may eventually be supported:

* Attribute types other than `float32`
* Polygonal (non-triangular) cells
* Collapses between non-adjacent vertices
* Maybe remove `position` and combine with vertex attribute type (like PLY format)
* Create a standard conformance test for codecs

# Reference Codec API

These reference codecs are installable via npm:

```
npm install 3p
```

Once installed, they can be required and used as CommonJS modules.

**Note** Reference codecs are not optimized.

## Encoder

### JSON

##### `require('3p/encode-json')(cells, positions[, vertexAttributes, cellAttributes])`

Compresses a triangulated mesh into a JSON formatted progressive triangle stream.

* `cells` is a list of triangles, each encoded as a list of 3 vertex indices
* `positions` is a list of vertex positions, each represented by 3 floating point values
* `vertexAttributes` is an optional array of vertex attributes
* `cellAttributes` is an optional array of per-face attributes

**Returns** A 3PJ encoded mesh object

### Binary

##### `require('3p/encode-binary')(cells, positions[, vertexAttributes, cellAttributes])`

Same interface as above, except returns a node.js Buffer object storing a binary 3PB file.

## Decoder

### JSON

##### `require('3p/decode-json')(json)`

Decodes a JSON formatted 3PJ object.

* `json` is a plain old JavaScript object storing the parsed 3PJ data

**Returns** An object representing the mesh with with the following properties:

* `cells` is an array storing the faces of the mesh
* `positions` is an array of vertex positions
* `vertexAttributes` is an array of vertex attributes
* `cellAttributes` is an array of cell attributes

### Binary

##### `require('3p/decode-binary')(buffer)`

Same as above, except takes a binary 3PB file instead of JSON.

## JSON and binary conversion

##### `require('3p/json-to-binary')(json)`
Converts a JSON 3PJ file to a binary 3PB buffer

* `json` is a 3PJ javascript object

**Returns** A `Buffer` representing a binary `3PB` file

##### `require('3p/binary-to-json')(buffer)`
Converts a binary 3PB file to a JSON 3PJ object

* `buffer` is a `Buffer` encoding a 3PB object

**Returns** A JSON 3PJ object

# Benchmarks and comparisons

**TODO**

# References

**TODO**

# License 

Copyright 2014 Mikola Lysenko.  MIT license