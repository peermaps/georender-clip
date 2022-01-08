var varint = require('varint')
var line = { start: 0, end: 0, positions: [] }
var area = { start: 0, end: 0, positions: [], cells: [], edges: [] }

module.exports = function parse(buf) {
  if (buf[0] === 0x02) {
    line.positions = []
    parseLine(line, buf)
    return line
  } else if (buf[0] === 0x03) {
    area.positions = []
    area.cells = []
    parseArea(area, buf)
    calcEdges(area, area)
    return area
  } else if (buf[0] === 0x04) {
    area.positions = []
    area.cells = []
    parseAreaWithEdges(area, buf)
    return area
  }
  return null
}

function parseLine(out, buf) {
  var offset = 0
  var ftype = buf[offset]
  offset += 1
  var type = varint.decode(buf, offset)
  offset += varint.decode.bytes
  var id = varint.decode(buf, offset)
  offset += varint.decode.bytes
  out.start = offset
  var pcount = varint.decode(buf, offset)
  offset += varint.decode.bytes
  out.positions.length = pcount
  for (var i = 0; i < pcount; i++) {
    var lon = buf.readFloatLE(offset)
    var lat = buf.readFloatLE(offset+4)
    offset += 8
    out.positions[i] = [lon,lat]
  }
  out.end = offset
  return out
}

function calcEdges(out, area) {
  out.edges
}

function parseArea(out, buf) {
  parseLine(out, buf) // lines are the same as area up to end of positions
  var offset = out.end
  var ccount = varint.decode(buf, offset)
  offset += varint.decode.bytes
  out.cells.length = ccount
  for (var i = 0; i < ccount; i++) {
    var c0 = varint.decode(buf, offset)
    offset += varint.decode.bytes
    var c1 = varint.decode(buf, offset)
    offset += varint.decode.bytes
    var c2 = varint.decode(buf, offset)
    offset += varint.decode.bytes
    out.cells[i] = [c0,c1,c2]
  }
  out.end = offset
  return out
}

function parseAreaWithEdges(out, buf) {
  // TODO
  //parseArea()
}
