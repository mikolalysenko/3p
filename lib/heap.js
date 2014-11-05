'use strict'

module.exports        = heapify
module.exports.push   = heapPush
module.exports.pop    = heapPop
module.exports.remove = heapRemove
module.exports.change = heapChange

function heapParent(i) {
  if(i & 1) {
    return (i - 1) >> 1
  }
  return (i >> 1) - 1
}

function heapUp(heap, i) {
  var node = heap[i]
  while(true) {
    var parentIndex = heapParent(i)
    if(parentIndex >= 0) {
      var parent = heap[parentIndex]
      if(node.error < parent.error) {
        heap[i] = parent
        parent.index = i
        i = parentIndex
        continue
      }
    }
    heap[i] = node
    node.index = i
    break
  }
}

function heapDown(heap, i) {
  var node  = heap[i]
  var count = heap.length
  while(true) {
    var left  = 2*i + 1
    var right = 2*(i + 1)
    var next  = i
    var w     = node.error
    if(left < count) {
      var lw = heap[left].error
      if(lw < w) {
        w    = lw
        next = left
      }
    }
    if(right < count) {
      var rw = heap[right].error
      if(rw < w) {
        w    = rw
        next = right
      }
    }
    if(next === i) {
      heap[i] = node
      node.index = i
      break
    }
    heap[i] = heap[next]
    heap[i].index = i
    i = next
  }
}

function heapPop(heap) {
  if(heap.length <= 0) {
    return null
  }
  var head = heap[0]
  if(heap.length > 1) {
    var head = heap[0]
    heap[0] = heap.pop()
    heapDown(heap, 0)
  } else {
    heap.pop()
  }
  head.index = -1
  return head
}

function heapPush(heap, item) {
  var count = heap.length
  heap.push(item)
  heapUp(heap, count)
}

function heapRemove(heap, item) {
  if(item.index < 0) {
    return
  }
  item.error = -Infinity
  heapUp(heap, item.index)
  return heapPop(heap)
}

function heapChange(heap, item, nerror) {
  if(item.error === nerror) {
    return
  }
  heapRemove(heap, item)
  item.error = nerror
  heapPush(heap, item)
}

function heapify(heap) {
  for(var i=1; i<heap.length; ++i) {
    heapUp(heap, i)
  }
}