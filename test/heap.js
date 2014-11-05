'use strict'

var heap = require('../lib/heap')
var tape = require('tape')

function heapParent(i) {
  if(i & 1) {
    return (i - 1) >> 1
  }
  return (i >> 1) - 1
}


tape('heap', function(t) {
  var items = [0, 5, 1, 3, 4, 2, 8, 7, 6, 9].map(function(i) {
    return { error: i }
  })

  function checkHeapInvariant(items) {
    for(var i=1; i<items.length; ++i) {
      t.equals(items[i].index, i, 'index ok')
      t.ok(items[i].error > items[heapParent(i)].error, 'heap invariant ' + i + ' vs ' + heapParent(i))
    }
  }

  heap(items)
  checkHeapInvariant(items)

  t.equals(items.length, 10)
  for(var i=0; i<10; ++i) {
    t.equals(heap.pop(items).error, i)
    t.equals(items.length, 9-i, 'heap capacity ' + i)
    checkHeapInvariant(items)
  }
  
  var pending = []
  for(var i=0; i<10; ++i) {
    pending[i] = { error: Math.random() }
  }
  var r = pending.slice()
  heap(pending)
  for(var i=9; i>=0; --i) {
    var x = heap.remove(pending, r[i])
    t.equals(x.index, -1, 'index cleared')
    t.equals(pending.length, i, 'heap length')
    checkHeapInvariant(pending)
  }

  var nitems = new Array(10)
  for(var i=0; i<10; ++i) {
    nitems[i] = { error: 10*Math.random() }
  }
  heap(nitems)
  checkHeapInvariant(nitems)
  var q = nitems.slice()
  for(var i=0; i<10; ++i) {
    heap.change(nitems, q[i], i)
    t.equals(nitems.length, 10, 'heap length unchanged')
    checkHeapInvariant(nitems)
  }

  t.equals(nitems.length, 10)
  for(var i=0; i<10; ++i) {
    t.equals(heap.pop(nitems).error, i)
    t.equals(nitems.length, 9-i, 'heap capacity ' + i)
    checkHeapInvariant(nitems)
  }

  t.end()
})