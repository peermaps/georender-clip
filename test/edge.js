var edge = require('../lib/edge.js')
var test = require('tape')

test('edge', function (t) {
  t.deepEqual(
    edge.pack([[3,2,7,50,51,52,53,54,55,56,9,15]]),
    [8,6,16,102,115,20,32],
    'pack'
  )
  t.deepEqual(
    edge.unpack([8,6,16,102,115,20,32]),
    [[3,2,7,50,51,52,53,54,55,56,9,15]],
    'unpack'
  )
  t.deepEqual(
    edge.pack([[1,2,3,4,5],[0,11,15,16,17,18,9],[50,51,53,55,60,61,62,63,70]]),
    [4,13,0,2,24,32,39,20,0,102,104,108,112,122,129,142],
    'pack multiple runs'
  )
  t.deepEqual(
    edge.unpack([4,13,0,2,24,32,39,20,0,102,104,108,112,122,129,142]),
    [[1,2,3,4,5],[0,11,15,16,17,18,9],[50,51,53,55,60,61,62,63,70]],
    'unpack multiple runs'
  )
  t.end()
})
