var distance = require('./hdist.js')
var pointInPolygon = require('geo-point-in-polygon')
var epsilon = 1e-8

module.exports = function (mesh) {
  var rings = []
  var start = -1
  var ring = []
  for (var i = 0; i < mesh.edges.length; i++) {
    var e = mesh.edges[i]
    ring.push(mesh.positions[e[0]])
    if (e[1] === start) {
      rings.push(ring)
      ring = []
      start = -1
    } else if (start < 0) {
      start = e[0]
    }
  }
  if (ring.length > 0) rings.push(ring)
  var coordinates = []
  var inside = Array(rings.length)
  for (var i = 0; i < rings.length; i++) {
    inside[i] = []
  }
  for (var i = 0; i < rings.length; i++) {
    for (var j = 0; j < rings.length; j++) {
      if (i === j) continue
      if (ringInsideRing(rings[i], rings[j])) {
        inside[i].push(j)
      }
    }
  }
  var matched = Array(rings.length).fill(-1)
  // exteriors
  for (var i = 0; i < inside.length; i++) {
    if (inside[i].length%2 === 0) {
      matched[i] = coordinates.length
      coordinates.push([rings[i]])
    }
  }
  // holes
  for (var i = 0; i < inside.length; i++) {
    if (inside[i].length%2 !== 1) continue
    var best = -1, ibest = -1
    for (var j = 0; j < inside[i].length; j++) {
      var n = inside[inside[i][j]].length
      if (n > best) {
        ibest = j
        best = n
      }
    }
    if (ibest < 0) continue
    var j = matched[ibest]
    if (j < 0) continue
    matched[i] = j
    coordinates[j].push(rings[i])
  }
  return coordinates
}

function ringInsideRing(inner, outer, epsilon) {
  // find first point in inner not equal to any point in outer
  for (var i = 0; i < inner.length; i++) {
    for (var j = 0; j < outer.length; j++) {
      if (distance(inner[i],outer[j]) <= epsilon) {
        break
      }
    }
    if (j === outer.length) break
  }
  if (i === inner.length) return false // same ring
  if (!pointInPolygon(inner[i], outer)) return false
  return true
}
