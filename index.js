var pclip = require('pclip')
var earcut = require('earcut')
var varint = require('varint')
var parse = require('./lib/parse.js')
var getEdges = require('./lib/get-edges.js')
var meshToCoords = require('./lib/mesh-to-coords.js')
var wrapClip = require('./lib/wrap-clip.js')

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
    var cs = meshToCoords(mesh)
    if (cs.length === 0) return []
    opts = Object.assign({ get: (nodes,i) => nodes[i] }, opts)
    var clipped = wrapClip(pclip, cs, B, opts)
    var out = []
    for (var i = 0; i < clipped.length; i++) {
      var edges = [], positions = [], holes = []
      for (var j = 0; j < clipped[i].length; j++) {
        var l = clipped[i][j].length
        var nn = null
        for (var k = 0; k < l; k++) {
          var n = clipped[i][j][k]
          positions.push(n.point[0], n.point[1])
          if (nn !== null && (!n.intersect || !nn.intersect)) {
            var e = positions.length/2
            edges.push(e-2,e-1)
          }
          nn = n
        }
        if (!clipped[i][j][0].intersect || !n.intersect) {
          var e = positions.length/2
          edges.push(e-1,e-l)
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

function repackArea(buf, area, edges, positions, holes) {
  var cells = earcut(positions, holes)
  var size = buf.length - (area.end - area.start)
    + varint.encodingLength(positions.length/2)
    + positions.length*4
    + varint.encodingLength(cells.length/3)
  for (var i = 0; i < cells.length; i++) {
    size += varint.encodingLength(cells[i])
  }
  var edgeCount = 0
  var start = -1, end = -1
  for (var i = 0; i < edges.length; i+=2) {
    var e0 = edges[i+0]
    var e1 = edges[i+1]
    if (e1 !== e0 + 1) {
      if (end - start === 1 < start) { // pair
        size += varint.encodingLength(start*2+0)
        size += varint.encodingLength(end)
      } else { // window
        size += varint.encodingLength(start*2+1)
        size += varint.encodingLength(end-start)
      }
      edgeCount++
      start = -1
    }
    if (start < 0) start = e0
    end = e1
  }
  if (edges.length > 0) {
    if (end - start === 1 || end < start) { // pair
      size += varint.encodingLength(start*2+0)
      size += varint.encodingLength(end)
    } else { // window
      size += varint.encodingLength(start*2+1)
      size += varint.encodingLength(end-start)
    }
    edgeCount++
  }
  size += varint.encodingLength(edgeCount)

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
  varint.encode(edgeCount, nbuf, offset)
  offset += varint.encode.bytes
  var start = -1, end = -1
  for (var i = 0; i < edges.length; i+=2) {
    var e0 = edges[i+0]
    var e1 = edges[i+1]
    if (e1 !== e0 + 1) {
      if (end - start === 1) { // pair
        varint.encode(start*2+0, nbuf, offset)
        offset += varint.encode.bytes
        varint.encode(end, nbuf, offset)
        offset += varint.encode.bytes
      } else { // window
        varint.encode(start*2+1, nbuf, offset)
        offset += varint.encode.bytes
        varint.encode(end-start, nbuf, offset)
        offset += varint.encode.bytes
      }
      start = -1
    }
    if (start < 0) start = e0
    end = e1
  }
  if (edges.length > 0) {
    if (end - start === 1 || end < start) { // pair
      varint.encode(start*2+0, nbuf, offset)
      offset += varint.encode.bytes
      varint.encode(end, nbuf, offset)
      offset += varint.encode.bytes
    } else { // window
      varint.encode(start*2+1, nbuf, offset)
      offset += varint.encode.bytes
      varint.encode(end-start, nbuf, offset)
      offset += varint.encode.bytes
    }
  }
  buf.copy(nbuf, offset, area.end, buf.length)
  offset += buf.length - area.end
  if (offset !== nbuf.length) {
    throw new Error(`repacked area buffer length (${nbuf.length}) does not match offset (${offset})`)
  }
  return nbuf
}
