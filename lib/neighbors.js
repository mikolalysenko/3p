'use strict'

module.exports = computeNeighborhood

//Somewhat messy helper function to compute the initial
//neighborhoods for each vertex (called at initialization)
function computeNeighborhood(cells, star, vertex) {
  if(star.length === 0) {
    return []
  }

  var nn = star.length

  var s0 = star[0]
  var c0 = cells[s0]
  var i0 = c0.indexOf(vertex)
  var v0 = c0[(i0 + 1) % 3]

  var result = new Array(nn)
  var rstar  = new Array(nn)
  result[0]  = v0
  rstar[0]   = s0
  for(var i=1; i<nn; ++i) {
    for(var j=0; j<nn; ++j) {
      var s1 = star[j]
      if(s1 === s0) {
        continue
      }
      var c1 = cells[s1]
      var i1 = c1.indexOf(vertex)
      if(c1[(i1+2)%3] === v0) {
        s0 = s1
        v0 = c1[(i1+1)%3]
        result[i] = v0
        rstar[i]  = s0
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
    star[j]    = rstar[(j+k)%nn]
  }
  return nresult
}