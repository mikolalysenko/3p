3p: Progressive Triangle Streams
================================

**DRAFT SPECIFICATION**

This module is a reference JavaScript codec for the progressive triangle stream (3PJ and 3PB) file format. It provides documentation and conformance tests. Optimized streaming decoders are provided by other packages.

Progressive triangle streams are an implementation [Hugh Hoppe's progressive meshes](1) with modifications that make it more suitable for web applications. Specifically, progressive triangle streams are optimized for fast lossless decoding instead of visual fidelity.  This tradeoff makes the resulting data more compact and speeds up loading higher resolution meshes at the cost that lower resolution meshes are somewhat degraded. For most web applications this is a reasonable tradeoff.

# Format description

Progressive triangle streams encode 3D triangulated meshes as a sequence of vertex split operations. Progressive triangle streams can have any number of vertex and/or face attributes, and can be truncated to produce approximations of the initial geometry. Progressive triangle streams support two distinct formats: a reference JSON format for debugging and a binary format.

Every progressive triangle stream contains 

## JSON format (.3PJ)

**TODO**

## Binary format (.3PB)

**TODO**

# Codec API

This module also provides a reference codec for the 3P file format.

## Encoder

### JSON

#### `require('3p/encode-json')(cells, positions[, vertexPositions, vertexAttributes])`

### Binary

#### `require('3p/encode-binary')(cells, positions[, vertexPositions, vertexAttributes])`

## Decoder

### JSON

#### `require('3p/decode-json')(json)`

### Binary

#### `require('3p/decode-binary')(buffer)`

## JSON and binary conversion

#### `require('3p/json-to-binary')(json)`

#### `require('3p/binary-to-json')(buffer)`

# References

[1] H. Hoppe. "Progessive meshes"

# License

Copyright 2014 Mikola Lysenko.  MIT license