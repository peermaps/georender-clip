var fixDepth = require('./fix-depth.js')
var distance = require('gl-vec2/distance')
var collinear3 = require('./collinear3')
var set = require('gl-vec2/set')

var b0 = [0,0], b1 = [0,0]

module.exports = function (positions, es, X, epsilon) {
  if (epsilon === undefined) epsilon = 1e-8
  X = fixDepth(X)
  var split = []
  for (var n = 0; n < es.length-1; n++) {
    var e0 = es[n], e1 = es[n+1]
    set(b0, positions[e0*2+0], positions[e0*2+1])
    set(b1, positions[e1*2+0], positions[e1*2+1])
    p: for (var i = 0; i < X.length; i++) {
      for (var j = 0; j < X[i].length; j++) {
        var l = X[i][j].length
        if (distance(X[i][j][0],X[i][j][l-1]) < epsilon) l--
        for (var k = 0; k < l; k++) {
          var a0 = X[i][j][k]
          var a1 = X[i][j][(k+1)%l]
          if (collinear3(b0,a0,a1,epsilon) && collinear3(b1,a0,a1,epsilon)) {
            split.push(n)
            break p
          }
        }
      }
    }
  }
  var edges = [], prev = 0
  for (var i = 0; i < split.length; i++) {
    if (split[i]-prev > 0) {
      edges.push(es.slice(prev,split[i]+1))
    }
    prev = split[i]+1
  }
  if (es.length-prev > 0) {
    edges.push(es.slice(prev))
  }
  return edges
}

function cmp(a,b) { return a < b ? -1 : +1 }
