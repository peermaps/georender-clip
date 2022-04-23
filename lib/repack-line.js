var varint = require('varint')

module.exports = function repackLine(buf, line, positions) {
  var size = buf.length - (line.end - line.start)
    + varint.encodingLength(positions.length)
    + positions.length*8
  var nbuf = Buffer.alloc(size)
  buf.copy(nbuf, 0, 0, line.start)
  nbuf[0] = 0x02
  var offset = line.start
  varint.encode(positions.length, nbuf, offset)
  offset += varint.encode.bytes
  for (var i = 0; i < positions.length; i++) {
    nbuf.writeFloatLE(positions[i][0], offset)
    offset += 4
    nbuf.writeFloatLE(positions[i][1], offset)
    offset += 4
  }
  buf.copy(nbuf, offset, line.end, buf.length)
  offset += buf.length - line.end
  if (offset !== nbuf.length) {
    throw new Error(`repacked line buffer length (${nbuf.length}) does not match offset (${offset})`)
  }
  return nbuf
}
