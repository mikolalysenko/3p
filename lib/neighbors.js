'use strict'

module.exports = computeNeighbors

//Vertex neighborhood, 2 invariants:
// 1. Oriented CCW
// 2. Lexicographically smallest comes first
function computeNeighbors(cells, star, vertex) {
  if(star.length === 0) {
    return []
  }

  var nn = star.length

  var s0 = star[0]
  var c0 = cells[s0]
  var i0 = c0.indexOf(vertex)
  var v0 = c0[(i0 + 1) % 3]

  var result = []
  result[0] = v0
  for(var i=1; i<nn; ++i) {
    for(var j=0; j<nn; ++j) {
      var s1 = star[j]
      if(s1 === s0) {
        continue
      }
      var c1 = cells[s1]
      var i1 = c1.indexOf(vertex)
      if(i1 >= 0 && c1[(i1+2)%3] === v0) {
        s0 = s1
        v0 = c1[(i1+1)%3]
        result[i] = v0
        break
      }
    }
  }
  
  //Extract k
  var k = 0
  var v = result[0]
  for(var i=1; i<nn; ++i) {
    var u = result[i]
    if(u < v) {
      k = i
      v = u
    }
  }

  //Shift so smallest item comes first
  var nresult = new Array(nn)
  for(var j=0; j<nn; ++j) {
    nresult[j] = result[(j+k)%nn]
  }
  return nresult
}