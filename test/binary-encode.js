'use strict'

var tape = require('tape')
var util = require('util')

var toBinary = require('../json-to-binary')
var toJSON = require('../binary-to-json')

tape('binary conversion', function(t) {

  var referenceJSON = {
    header: {
      version: "1.0.0",
      vertexCount: 5,
      cellCount: 6,
      vertexAttributeTypes: [
        {
          name: "position",
          type: "float32",
          count: 3
        },
        {
          name: "color",
          type: "uint8",
          count: 4
        },
        {
          name: "id",
          type: "uint8",
          count: 1
        }
      ],
      cellAttributeTypes: [
        {
          name: "uv",
          type: "int16",
          count: 2
        }
      ]
    },
    initialComplex: {
      vertexCount: 4,
      cellCount:   4,
      vertexAttributes: [
        [
          [-0.5,-0.5,0.5],
          [1,0,0],
          [0,1,0],
          [0,0,1]
        ],
        [
          [255,0,0,255],
          [0,255,0,255],
          [0,0,255,255],
          [255,255,0,255]
        ],
        [ 1, 2, 3, 4 ]
      ],
      cells: [
        [0,1,2],
        [0,1,3],
        [0,2,3],
        [1,2,3]
      ],
      cellAttributes: [
        [
          [1,-2],
          [3,-4],
          [5,-6],
          [7,-1000]
        ]
      ]
    },
    vertexSplits: [
      { 
        baseVertex: 0,
        vertexAttributes: [
          [0,0,0],
          [0,255,255,255],
          8
        ],
        left: 1,
        leftOrientation: true,
        leftAttributes: [
          [-10,8000]
        ],
        right: 2,
        rightOrientation: true,
        rightAttributes: [
          [0,0]
        ]
      }
    ]
  }

  var binary = toBinary(referenceJSON)
  var recovered = toJSON(binary)
  t.same(recovered, referenceJSON, 'test encoding correct')

  t.end()
})