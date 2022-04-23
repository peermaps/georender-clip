var earcut = require('earcut')
var varint = require('varint')
var edgePack = require('./edge.js')

module.exports = function repackArea(buf, area, edgeRuns, positions, holes) {
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
