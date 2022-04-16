//var pclip = require('pclip')
var pclip = require('./algorithms.js').polygonClipping

module.exports = function (A, B, opts) {
  var clipped = []
  for (var i = 0; i < B.length; i++) {
    clipped = clipped.concat(pclip.intersect(A, B[i], opts))
  }
  return clipped
}
