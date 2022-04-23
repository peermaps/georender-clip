var intersect = require('line-segment-intersect-2d')
var distance = require('gl-vec2/distance')
var v0 = [0,0]
var epsilon = 1e-8

module.exports = function clipLine(positions, X) {
  var run = [], out = []
  for (var n = 0; n < positions.length-1; n++) {
    var a0 = positions[n+0]
    var a1 = positions[n+1]
    p: for (var i = 0; i < X.length; i++) {
      for (var j = 0; j < X[i].length; j++) {
        var l = X[i][j].length
        if (distance(X[i][j][0],X[i][j][l-1]) < epsilon) l--
        for (var k = 0; k < X[i][j].length; k++) {
          var b0 = X[i][j][k]
          var b1 = X[i][j][(k+1)%l]
          if (intersect(v0, a0, a1, b0, b1, epsilon)) {
            if (!(distance(v0,a0) < epsilon)) break p
          }
        }
      }
    }
    if (i === X.length) {
      run.push(a0)
    } else if (distance(v0,a1) < epsilon) {
      run.push(a1)
      out.push(run)
      run = []
    }
  }
  if (run.length > 0) out.push(run)
  return out
}
