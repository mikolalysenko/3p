3p: Progressive Triangle Streams
================================

**DRAFT SPECIFICATION**


Progressive triangle streams are an implementation [Hugh Hoppe's progressive meshes](1) with modifications favoring small file sizes and fast lossless decoding over the visual fidelity of intermediate representations.

This module provides documentation of the progressive triangle stream format as well as reference codecs for the binary and JSON containers. Optimized streaming decoders for specific applications are provided by other packages.

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