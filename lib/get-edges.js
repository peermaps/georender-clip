module.exports = function (cells, positions) {
  var ecount = {}
  for (var i = 0; i < cells.length; i++) {
    if (cells[i][0] === cells[i][1]) continue
    if (cells[i][1] === cells[i][2]) continue
    if (cells[i][2] === cells[i][0]) continue
    var e0 = ekey(cells[i][0],cells[i][1])
    var e1 = ekey(cells[i][1],cells[i][2])
    var e2 = ekey(cells[i][2],cells[i][0])
    ecount[e0] = (ecount[e0] || 0) + 1
    ecount[e1] = (ecount[e1] || 0) + 1
    ecount[e2] = (ecount[e2] || 0) + 1
  }
  var ekeys = Object.keys(ecount)
  var egraph = {}, edges = []
  for (var i = 0; i < ekeys.length; i++) {
    var k = ekeys[i]
    if (ecount[k] !== 1) continue
    var e = k.split(',').map(Number)
    if (egraph[e[0]]) egraph[e[0]].push(e[1])
    else egraph[e[0]] = [e[1]]
    if (egraph[e[1]]) egraph[e[1]].push(e[0])
    else egraph[e[1]] = [e[0]]
    edges.push(e)
  }
  var visited = {}, evisited = {}
  var emap = {}, nedges = []
  var index = 0
  var e = null
  var start = -1

  for (var i = 0; i < edges.length; i++) {
    var ek = ekey(edges[i][0], edges[i][1])
    if (evisited[ek]) continue
    for (var j = 0; j < 2; j++) {
      var c = edges[i][j] 
      while (true) {
        if (c === start) break
        var es = egraph[c]
        var cn = -1, ek = null
        for (var j = 0; j < es.length; j++) {
          ek = ekey(c,es[j])
          if (!evisited[ek]) {
            cn = es[j]
            break
          }
        }
        if (cn < 0) break
        evisited[ek] = true
        if (!emap.hasOwnProperty(c)) emap[c] = index++
        if (!emap.hasOwnProperty(cn)) emap[cn] = index++
        nedges.push([emap[c],emap[cn]])
        if (start < 0) start = c
        c = cn
      }
      start = -1
    }
  }

  for (var i = 0; i < positions.length; i++) {
    if (!emap.hasOwnProperty(i)) {
      emap[i] = index++
    }
  }
  return {
    positions: positions.map((_,i) => positions[emap[i]]),
    cells: cells.map(cs => [emap[cs[0]],emap[cs[1]],emap[cs[2]]]),
    edges: nedges,
  }
}

function ekey(i,j) { return i < j ? i+','+j : j+','+i }
