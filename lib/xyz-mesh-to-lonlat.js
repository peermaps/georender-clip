var pclip = require('./algorithms.js').polygonClipping
var distance = require('./hdist.js')
var gcApex = require('great-circle-apex')
var toLonLat = require('./to-lonlat.js')
var bbox = [0,0,0,0]
var epsilon = 1e-8
var bounds = [[-180,-90],[-180,+90],[+180,+90],[+180,-90]]
var northPole = [0,+90]
var southPole = [0,-90]

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
  /*
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
  */
  calcBbox(bbox, m)
  var min = 360, best = -1, dir = 1
  if (bbox[2]-bbox[0] > 180) {
    for (var i = 0; i < m.length; i++) {
      m[i][0] -= 360
      calcBbox(bbox, m)
      if (bbox[2]-bbox[0] < min) {
        min = bbox[2]-bbox[0]
        dir = -1
        best = i
      }
      m[i][0] += 360*2
      calcBbox(bbox, m)
      if (bbox[2]-bbox[0] < min) {
        min = bbox[2]-bbox[0]
        dir = +1
        best = i
      }
      m[i][0] -= 360
    }
    m[best][0] += 360*dir
  }
  for (var i = 0; i < m.length; i++) {
    var m0 = m[i], m1 = m[(i+1)%m.length], m2 = m[(i+2)%m.length]
    if (Math.abs(m0[0]-m1[0]) < epsilon) continue
    if (Math.abs(m0[1]) > 90-epsilon) continue
    if (Math.abs(m1[1]) > 90-epsilon) continue
    if (distance(m2,northPole) < epsilon) {
      m = [m0,m1,[m1[0],+90],[m0[0],+90]]
      break
    } else if (distance(m2,southPole) < epsilon) {
      m = [m0,m1,[m1[0],-90],[m0[0],-90]]
      break
    }
    var apex = gcApex([],m0,m1)
    if (distance(apex,northPole) < epsilon) {
      m.splice(i+1,0,[m0[0],+90],[m1[0],+90])
      break
    } else if (distance(apex,southPole) < epsilon) {
      m.splice(i+1,0,[m0[0],-90],[m1[0],-90])
      break
    }
  }
  calcBbox(bbox, m)
  if (bbox[0] >= 180-epsilon) {
    for (var i = 0; i < m.length; i++) {
      m[i][0] -= 360
    }
  }
  if (bbox[2] <= -180+epsilon) {
    for (var i = 0; i < m.length; i++) {
      m[i][0] += 360
    }
  }
  var res = []
  md = pclip.intersect(m, bounds)
  if (md.length > 0) res.push(md[0])

  calcBbox(bbox, m)
  if (bbox[2] > 180) {
    var md = []
    for (var i = 0; i < m.length; i++) {
      md.push([m[i][0]-360,m[i][1]])
    }
    md = pclip.intersect(md, bounds)
    if (md.length > 0) res.push(md[0])
    //res.push([md])
  }
  if (bbox[0] < -180) {
    var md = []
    for (var i = 0; i < m.length; i++) {
      md.push([m[i][0]+360,m[i][1]])
    }
    md = pclip.intersect(md, bounds)
    if (md.length > 0) res.push(md[0])
    //res.push([md])
  }
  return res
}

function calcBbox(out, m) {
  out[0] = Infinity
  out[1] = Infinity
  out[2] = -Infinity
  out[3] = -Infinity
  for (var i = 0; i < m.length; i++) {
    var p = m[i]
    out[0] = Math.min(out[0],p[0])
    out[1] = Math.min(out[1],p[1])
    out[2] = Math.max(out[2],p[0])
    out[3] = Math.max(out[3],p[1])
  }
  return out
}
