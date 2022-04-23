// self-intersections
var intersect = require('line-segment-intersect-2d')
var distance = require('gl-vec2/distance')
var v0 = [0,0]

module.exports = function (mesh, epsilon) {
  if (epsilon === undefined) epsilon = 1e-8
  var pmap = new Map, imap = new Map
  for (var i = 0; i < mesh.positions.length; i++) {
    var a = mesh.positions[i]
    for (var j = 0; j < mesh.positions.length; j++) {
      if (i === j) continue
      var b = mesh.positions[j]
      if (distance(a,b) < epsilon) {
        if (pmap.has(i) && pmap.has(j)) {
          imap.set(pmap.get(j),pmap.get(i))
          pmap.set(j,pmap.get(i))
        } else if (pmap.has(i)) {
          pmap.set(j,pmap.get(i))
        } else if (pmap.has(j)) {
          pmap.set(i,pmap.get(j))
        } else {
          imap.set(i,i)
          pmap.set(i,i)
          pmap.set(j,i)
        }
      }
    }
  }

  var rmc = new Set
  for (var i = 0; i < mesh.cells.length; i++) {
    var c = mesh.cells[i]
    if (pmap.has(c[0])) {
      c[0] = imap.get(pmap.get(c[0]))
    }
    if (pmap.has(c[1])) {
      c[1] = imap.get(pmap.get(c[1]))
    }
    if (pmap.has(c[2])) {
      c[2] = imap.get(pmap.get(c[2]))
    }
    if (c[0] === c[1]) rmc.add(i)
    else if (c[0] === c[2]) rmc.add(i)
    else if (c[2] === c[0]) rmc.add(i)
  }
  if (rmc.size > 0) {
    //console.error('rmc',rmc.size)
    mesh.cells = mesh.cells.filter((c,i) => !rmc.has(i))
  }

  var rme = new Set
  for (var i = 0; i < mesh.edges.length; i++) {
    var e = mesh.edges[i]
    if (pmap.has(e[0])) {
      e[0] = imap.get(pmap.get(e[0]))
    }
    if (pmap.has(e[1])) {
      e[1] = imap.get(pmap.get(e[1]))
    }
    if (e[0] === e[1]) rme.add(i)
  }
  if (rme.size > 0) {
    //console.error('rme',rme.size)
    mesh.edges = mesh.edges.filter((e,i) => !rme.has(i))
  }
}
