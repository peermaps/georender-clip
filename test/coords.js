var test = require('tape')
var toCoords = require('../lib/to-gj-coords')

test('coords', function (t) {
  var c0 = [[0,1,2],[1,2,3]]
  var p0 = [[4,5],[5,7],[6,5],[7,8]]
  t.deepEqual(toCoords(c0, p0), {
    positions: [[4,5],[5,7],[7,8],[6,5]],
    cells: [[0,1,3],[1,3,2]],
    edges: [[0,1],[1,2],[2,3],[3,0]],
  })
  var c1 = [[4,5,6],[0,1,2],[1,2,3]]
  var p1 = [[4,5],[5,7],[6,5],[7,8],[10,10],[10,11],[11,10]]
  t.deepEqual(toCoords(c1,p1), {
    positions: [[7,8],[10,10],[11,10],[10,11],[4,5],[5,7],[6,5]],
    cells: [[0,1,2],[3,4,6],[4,6,5]],
    edges: [[0,1],[1,2],[2,0],[3,4],[4,5],[5,6],[6,3]],
  })
  t.end()
})
