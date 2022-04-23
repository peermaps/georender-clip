var distance = require('gl-vec2/distance')

module.exports = function collinear3(a,b,c,epsilon) {
  var d0 = distance(b,c)
  var d1 = distance(a,b)
  var d2 = distance(a,c)
  return Math.abs(d0-d1-d2) < epsilon
}
