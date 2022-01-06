module.exports = function toLonLat(out, p) {
  var q = Math.sqrt(p[0]*p[0]+p[1]*p[1])
  var lat = Math.atan2(p[2],q)*180/Math.PI
  var lon = Math.atan2(p[1],p[0])*180/Math.PI
  out[0] = lon
  out[1] = lat
  return out
}
