var pclip = require('./lib/algorithms.js').polygonClipping
var repackArea = require('./lib/repack-area.js')
var repackLine = require('./lib/repack-line.js')
var clipLine = require('./lib/clip-line.js')
var parse = require('./lib/parse.js')
var getEdges = require('./lib/get-edges.js')
var meshToCoords = require('./lib/mesh-to-coords.js')
var fix = require('./lib/fix.js')
var removeGrid = require('./lib/remove-grid.js')
var slowDivide = require('./lib/slow-divide.js')
var vec2 = require('gl-vec2')
var v0 = [0,0], v1 = [0,0]

module.exports = function clip(A, B, opts) {
  var epsilon = opts.epsilon || 1e-8
  var flip = !Buffer.isBuffer(A) && Buffer.isBuffer(B)
  var buf = flip ? B : A
  if (flip) {
    B = A
  }
  if (buf[0] === 0x01) return buf
  if (buf[0] === 0x02) {
    var line = parse(buf)
    var lines = clipLine(line.positions, B, opts)
    var out = []
    for (var i = 0; i < lines.length; i++) {
      out.push(repackLine(buf, line, lines[i]))
    }
    return out
  } else if (buf[0] === 0x03) {
    var area = parse(buf)
    var mesh = getEdges(area.cells, area.positions)
    fix(mesh)
    var cs = meshToCoords(mesh)
    if (cs.length === 0) return []
    opts = Object.assign({ get: (nodes,i) => nodes[i] }, opts)
    var clipped = opts.mode === 'divide' ? slowDivide(cs, B, opts) : pclip(cs, B, opts)
    //var clipped = pclip(cs, B, opts)
    var out = []
    for (var i = 0; i < clipped.length; i++) {
      var edges = [], positions = [], holes = []
      for (var j = 0; j < clipped[i].length; j++) {
        var l = clipped[i][j].length
        if (vec2.distance(clipped[i][j][0],clipped[i][j][l-1]) < epsilon) l--
        var estart = positions.length/2
        var es = []
        for (var k = 0; k < l; k++) {
          var n = clipped[i][j][k]
          if (k+1 === l) {
            vec2.set(v0, positions[0], positions[1])
            if (!(vec2.distance(v0,n) < epsilon)) {
              es.push(positions.length/2)
            }
          } else {
            es.push(positions.length/2)
          }
          positions.push(n[0], n[1])
        }
        if (es[es.length-1] !== es[0]) es.push(estart/2)
        if (opts.mode === 'divide') {
          edges = edges.concat(removeGrid(positions, es, B, epsilon))
        } else {
          edges.push(es)
        }
        if (j+1 !== clipped[i].length) holes.push(positions.length/2)
      }
      out.push(repackArea(buf, area, edges, positions, holes))
    }
    return out
  } else if (buf[0] === 0x04) {
    // todo
    return []
  }
}

function toPoints(g) {
  for (var d = 0, x = g; Array.isArray(x); x = x[0]) d++;
  var result = []
  if (d === 1) {
    for (var i = 0; i < g.length; i++) {
      result.push(g[i].point)
    }
  } else if (d === 2) {
    for (var i = 0; i < g.length; i++) {
      var ring = []
      for (var j = 0; j < g[i].length; j++) {
        ring.push(g[i][j].point)
      }
      result.push(ring)
    }
  } else if (d === 3) {
    for (var i = 0; i < g.length; i++) {
      var rings = []
      for (var j = 0; j < g[i].length; j++) {
        var ring = []
        for (var k = 0; k < g[i][j].length; k++) {
          ring.push(g[i][j][k].point)
        }
        rings.push(ring)
      }
      result.push(rings)
    }
  }
  return result
}
