var intersect = require('line-segment-intersect-2d')
var distance = require('gl-vec2/distance')
var collinear3 = require('./collinear3.js')
var v0 = [0,0]

module.exports = function clipLine(positions, X, opts) {
  if (positions.length < 2) return []
  if (opts.mode !== 'divide') {
    throw new Error('only division presently implemented for line clipping')
  }
  var epsilon = opts.epsilon || 1e-8
  var run = [], out = [], matches = []
  var visited = new Set
  for (var n = 0; n < positions.length-1; n++) {
    var a0 = positions[n+0]
    var a1 = positions[n+1]
    matches.length = 0
    run.push(a0)
    for (var i = 0; i < X.length; i++) {
      var ix = 0
      for (var j = 0; j < X[i].length; j++) {
        var l = X[i][j].length
        if (distance(X[i][j][0],X[i][j][l-1]) < epsilon) l--
        for (var k = 0; k < l; k++) {
          var b0 = X[i][j][k]
          var b1 = X[i][j][(k+1)%l]
          var jx = k === l-1 ? ix-k : ix+1
          if (collinear3(b0, a0, a1, epsilon)) {
            if (!visited.has(ix)) {
              var t = distance(a0,b0) / distance(a0,a1)
              matches.push({ t, point: [b0[0],b0[1]], ix })
              visited.add(ix)
            }
          } else if (collinear3(b1, a0, a1, epsilon)) {
            if (!visited.has(jx)) {
              var t = distance(a0,b1) / distance(a0,a1)
              matches.push({ t, point: [b1[0],b1[1]], ix: jx })
              visited.add(jx)
            }
          } else if (intersect(v0, a0, a1, b0, b1, epsilon)) {
            var t = distance(v0,a0) / distance(a0,a1)
            matches.push({ t, point: [v0[0],v0[1]], ix })
          }
          ix++
        }
      }
    }
    if (matches.length > 0) {
      matches.sort(cmp)
      for (var i = 0; i < matches.length; i++) {
        var m = matches[i]
        run.push(m.point)
        out.push(run)
        run = m.t > 1-epsilon ? [] : [ m.point ]
      }
    }
  }
  run.push(positions[n])
  if (run.length > 1) out.push(run)
  return out
}

function cmp(a,b) { return a.t < b.t ? -1 : +1 }
