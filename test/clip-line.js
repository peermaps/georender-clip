var test = require('tape')
var clip = require('../lib/clip-line.js')

test('clip line collinear 1/3 and 2/3 crossings', function (t) {
  var positions = [[0,0],[3,3]]
  var X = [[[[1,1],[1,2],[2,2],[2,1]]]]
  t.deepEqual(clip(positions, X, { mode: 'divide' }), [
    [[0,0],[1,1]],
    [[1,1],[2,2]],
    [[2,2],[3,3]],
  ])
  t.end()
})

test('clip line/line 2 crossings', function (t) {
  var positions = [[0,1.5],[3,1.5]]
  var X = [[[[1,1],[1,2],[2,2],[2,1]]]]
  t.deepEqual(clip(positions, X, { mode: 'divide' }), [
    [[0,1.5],[1,1.5]],
    [[1,1.5],[2,1.5]],
    [[2,1.5],[3,1.5]],
  ])
  t.end()
})

test('clip line/line 1 crossing', function (t) {
  var positions = [[0,1.5],[1.5,1.5]]
  var X = [[[[1,1],[1,2],[2,2],[2,1]]]]
  t.deepEqual(clip(positions, X, { mode: 'divide' }), [
    [[0,1.5],[1,1.5]],
    [[1,1.5],[1.5,1.5]],
  ])
  t.end()
})

test('clip line 0 crossings', function (t) {
  var positions = [[0,0],[3,0]]
  var X = [[[[1,1],[1,2],[2,2],[2,1]]]]
  t.deepEqual(clip(positions, X, { mode: 'divide' }), [
    [[0,0],[3,0]],
  ])
  t.end()
})

test('clip line with last point exactly on edge 1 crossing', function (t) {
  var positions = [[0,1.5],[2,1.5]]
  var X = [[[[1,1],[1,2],[2,2],[2,1]]]]
  t.deepEqual(clip(positions, X, { mode: 'divide' }), [
    [[0,1.5],[1,1.5]],
    [[1,1.5],[2,1.5]],
  ])
  t.end()
})

test('clip line with last point exactly on edge 0 crossings', function (t) {
  var positions = [[0,1.5],[2,1.5]]
  var X = [[[[1,1],[1,2],[2,2],[2,1]]]]
  t.deepEqual(clip(positions, X, { mode: 'divide' }), [
    [[0,1.5],[1,1.5]],
    [[1,1.5],[2,1.5]],
  ])
  t.end()
})
