var fixDepth = require('./fix-depth.js')
var set = require('gl-vec2/set')
var distance = require('gl-vec2/distance')
var b0 = [0,0], b1 = [0,0]
var epsilon = 1e-8

module.exports = function (positions, es, X) {
  X = fixDepth(X)
  var split = [], isSplit = new Set
  for (var i = 0; i < X.length; i++) {
    for (var j = 0; j < X[i].length; j++) {
      var l = X[i][j].length
      if (distance(X[i][j][0],X[i][j][l-1]) < epsilon) l--
      for (var k = 0; k < l; k++) {
        var a0 = X[i][j][k]
        var a1 = X[i][j][(k+1)%l]
        for (var n = 0; n < es.length-1; n++) {
          if (isSplit.has(n)) continue
          var e0 = es[n], e1 = es[n+1]
          set(b0, positions[e0*2+0], positions[e0*2+1])
          set(b1, positions[e1*2+0], positions[e1*2+1])
          if (collinear3(b0,a0,a1) && collinear3(b1,a0,a1)) {
            split.push(n)
            isSplit.add(n)
          }
        }
      }
    }
  }
  var edges = []
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
          if (collinear3(b0,a0,a1) && collinear3(b1,a0,a1)) break p
        }
      }
    }
    if (i === X.length) {
      edges.push([e0,e1])
    }
  }
  return edges
  //return [es]
}

function collinear3(a,b,c) {
  var d0 = distance(b,c)
  var d1 = distance(a,b)
  var d2 = distance(a,c)
  return Math.abs(d0-d1-d2) < epsilon
}

function cmp(a,b) { return a < b ? -1 : +1 }
