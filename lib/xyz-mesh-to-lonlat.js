var toLonLat = require('./to-lonlat.js')
var bbox = [0,0,0,0]
var epsilon = 1e-8

module.exports = function (mesh) {
  var features = []
  for (var i = 0; i < mesh.cells.length; i++) {
    var c0 = mesh.cells[i][0]
    var c1 = mesh.cells[i][1]
    var c2 = mesh.cells[i][2]
    var p0 = toLonLat([0,0], mesh.positions[c0])
    var p1 = toLonLat([0,0], mesh.positions[c1])
    var p2 = toLonLat([0,0], mesh.positions[c2])
    var cs = cutMeridian([p0,p1,p2])
    features = features.concat(cs)
  }
  return features
}

function cutMeridian(m) {
  var cpam = 0, cnam = 0, cp = 0, cn = 0
  for (var i = 0; i < m.length; i++) {
    var p = m[i]
    if (Math.abs(180-p[0]) < epsilon) {
      cpam++
    } else if (Math.abs(-180-p[0]) < epsilon) {
      cnam++
    } else if (p[0] >= 0) {
      cp++
    } else if (p[0] < 0) {
      cn++
    }
  }
  //if (cpam + cnam > 0) console.log('BEFORE', m, cpam, cnam, cp, cn)
  if (cpam > 0 && cp === 0) {
    for (var i = 0; i < m.length; i++) {
      var p = m[i]
      if (Math.abs(180-p[0]) < epsilon) {
        p[0] -= 360
      }
    }
  } else if (cnam > 0 && cn === 0) {
    for (var i = 0; i < m.length; i++) {
      var p = m[i]
      if (Math.abs(-180-p[0]) < epsilon) {
        p[0] += 360
      }
    }
  }
  //if (cpam + cnam > 0) console.log('AFTER', m)
  return [[m]]
}
