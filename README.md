3p: Progressive Triangle Streams
================================

**DRAFT SPECIFICATIOn**

This module is a reference JavaScript codec for the progressive triangle stream (3PJ and 3PB) file format. It provides documentation and conformance tests. Optimized streaming decoders are provided by other packages.

Progressive triangle streams are an implementation [Hugh Hoppe's progressive meshes](1) with modifications that make it more suitable for web applications. Specifically, progressive triangle streams are optimized for fast lossless decoding instead of visual fidelity.  This tradeoff makes the resulting data more compact and speeds up loading higher resolution meshes at the cost that lower resolution meshes are somewhat degraded. For most web applications this is a reasonable tradeoff.

# Format description

Progressive triangle streams encode 3D triangulated meshes as a sequence of vertex split operations. Progressive triangle streams can have any number of vertex and/or face attributes, and can be truncated to produce approximations of the initial geometry. Progressive triangle streams support two distinct formats: a reference JSON format and a binary format for distribution.

Positions and attributes in 3P files are stored as 32 bit floating point values.

## JSON format (.3PJ)

## Binary format (.3PB)


# Codec API

## Encoder

### JSON

### Binary


## Decoder

### JSON

### Binary


## JSON and binary conversion


# References

[1] H. Hoppe. "Progessive meshes"

# License

Copyright 2014 Mikola Lysenko.  MIT license