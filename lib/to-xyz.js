module.exports = function toXYZ(out, p) {
  var lon = p[0]/180*Math.PI, lat = p[1]/180*Math.PI
  out[0] = Math.cos(lat) * Math.cos(lon)
  out[1] = Math.cos(lat) * Math.sin(lon)
  out[2] = Math.sin(lat)
  return out
}
