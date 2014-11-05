3p: Progressive Triangle Streams
================================

**DRAFT SPECIFICATION**

Progressive triangle streams are an implementation [Hugh Hoppe's progressive meshes](http://research.microsoft.com/en-us/um/people/hoppe/proj/pm/) with modifications favoring small file sizes and fast lossless decoding over the visual fidelity of intermediate representations.

This module provides documentation of the progressive triangle stream format as well as reference codecs for the binary and JSON containers. Optimized streaming decoders for specific applications are provided by other packages.

## Other implementations

* TODO

# Format description

Progressive triangle streams encode 3D triangulated meshes as a sequence of vertex split operations. Progressive triangle streams can have any number of vertex and/or face attributes, and can be truncated to produce approximations of the initial geometry. Progressive triangle streams support two distinct formats: a reference JSON format for debugging and a binary format.

## JSON format (.3PJ)

**TODO**

## Binary format (.3PB)

**TODO**

# Codec API

These reference codecs are installable via npm:

```
npm install 3p
```

Once installed, they can be required and used as CommonJS modules.

Note that these codecs are not optimized for speed.

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

# References


# License

Copyright 2014 Mikola Lysenko.  MIT license