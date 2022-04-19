//var pclip = require('pclip')
var pclip = require('./lib/algorithms.js').polygonClipping
var earcut = require('earcut')
var varint = require('varint')
var parse = require('./lib/parse.js')
var edgePack = require('./lib/edge.js')
var getEdges = require('./lib/get-edges.js')
var meshToCoords = require('./lib/mesh-to-coords.js')
var fix = require('./lib/fix.js')
var slowDivide = require('./lib/slow-divide.js')

module.exports = function clip(A, B, opts) {
  var flip = !Buffer.isBuffer(A) && Buffer.isBuffer(B)
  var buf = flip ? B : A
  if (flip) {
    B = A
  }
  if (buf[0] === 0x01) return buf
  if (buf[0] === 0x02) {
    var line = parse(buf)
    // todo: clip line
    return []
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
        var nn = null
        var estart = positions.length/2
        var es = []
        for (var k = 0; k < l; k++) {
          var n = clipped[i][j][k]
          es.push(positions.length/2)
          positions.push(n[0], n[1])
          nn = n
        }
        es.push(estart/2)
        edges.push(es)
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

function repackArea(buf, area, edgeRuns, positions, holes) {
  var edges = edgePack.pack(edgeRuns)
  var cells = earcut(positions, holes)
  var size = buf.length - (area.end - area.start)
    + varint.encodingLength(positions.length/2)
    + positions.length*4
    + varint.encodingLength(cells.length/3)
    + varint.encodingLength(edges.length)
  for (var i = 0; i < cells.length; i++) {
    size += varint.encodingLength(cells[i])
  }
  for (var i = 0; i < edges.length; i++) {
    size += varint.encodingLength(edges[i])
  }

  var nbuf = Buffer.alloc(size)
  buf.copy(nbuf, 0, 0, area.start)
  nbuf[0] = 0x04
  var offset = area.start
  varint.encode(positions.length/2, nbuf, offset)
  offset += varint.encode.bytes
  for (var i = 0; i < positions.length; i++) {
    nbuf.writeFloatLE(positions[i], offset)
    offset += 4
  }
  varint.encode(cells.length/3, nbuf, offset)
  offset += varint.encode.bytes
  for (var i = 0; i < cells.length; i++) {
    varint.encode(cells[i], nbuf, offset)
    offset += varint.encode.bytes
  }
  varint.encode(edges.length, nbuf, offset)
  offset += varint.encode.bytes
  for (var i = 0; i < edges.length; i++) {
    varint.encode(edges[i], nbuf, offset)
    offset += varint.encode.bytes
  }
  buf.copy(nbuf, offset, area.end, buf.length)
  offset += buf.length - area.end
  if (offset !== nbuf.length) {
    throw new Error(`repacked area buffer length (${nbuf.length}) does not match offset (${offset})`)
  }
  return nbuf
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
