var pclip = require('pclip')
var geo = require('pclip/geo')
var earcut = require('earcut')
var varint = require('varint')
var parse = require('./lib/parse.js')
var getEdges = require('./lib/get-edges.js')
var meshToCoords = require('./lib/mesh-to-coords.js')
var empty = Buffer.alloc(0)

exports.divide = function divide(buf, grid) {
  if (buf[0] === 0x01) return buf
  if (buf[0] === 0x02) {
    var line = parse(buf)
    // todo: clip line
    return empty
  } else if (buf[0] === 0x03) {
    var area = parse(buf)
    var mesh = getEdges(area.cells, area.positions)
    var cs = meshToCoords(mesh)
    if (cs.length === 0) return empty
    var opts = Object.assign({ get: (nodes,i) => nodes[i], }, geo)
    var divided = pclip.divide(cs, grid, opts)
    var edges = [], positions = [], holes = []
    for (var i = 0; i < divided.length; i++) {
      for (var j = 0; j < divided[i].length; j++) {
        var l = divided[i][j].length
        var nn = null
        for (var k = 0; k < l; k++) {
          var n = divided[i][j][k]
          positions.push(n.point[0], n.point[1])
          if (nn !== null && !n.intersect && !nn.intersect) {
            var e = positions.length/2
            edges.push(e-2,e-1)
          }
          nn = n
        }
        if (!divided[i][j][0].intersect && !n.intersect) {
          var e = positions.length/2
          edges.push(e-1,e-l)
        }
        if (j+1 !== divided[i].length) holes.push(positions.length/2)
      }
    }
    return repackArea(buf, area, edges, positions, holes)
  } else if (buf[0] === 0x04) {
    // todo
    return empty
  }
}

function repackArea(buf, area, edges, positions, holes) {
  var cells = earcut(positions, holes)
  var size = buf.length - area.end + area.start
    + positions.length*4
    + varint.encodingLength(positions.length/2)
    + varint.encodingLength(cells.length/3)
  for (var i = 0; i < cells.length; i++) {
    size += varint.encodingLength(cells[i])
  }
  var edgeCount = 0
  var start = -1, end = -1, e0 = -1, e1 = -1
  for (var i = 0; i < edges.length; i+=2) {
    e0 = edges[i+0]
    e1 = edges[i+1]
    if (e1 !== e0 + 1) {
      if (end - start === 1) { // pair 
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
  if (end - start === 1) { // pair 
    size += varint.encodingLength(start*2+0)
    size += varint.encodingLength(end)
  } else { // window
    size += varint.encodingLength(start*2+1)
    size += varint.encodingLength(end-start)
  }
  edgeCount++
  size += varint.encodingLength(edgeCount)

  var nbuf = Buffer.alloc(size)
  var offset = 0
  buf.copy(nbuf, offset, 0, area.start)
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
  var start = -1, end = -1, e0 = -1, e1 = -1
  for (var i = 0; i < edges.length; i+=2) {
    e0 = edges[i+0]
    e1 = edges[i+1]
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
  buf.copy(nbuf, offset, area.end, buf.length)
  return nbuf
}
