exports.pack = function (runs) {
  var result = []
  for (var i = 0; i < runs.length; i++) {
    if (i > 0) result.push(0)
    var start = -1
    for (var j = 0; j < runs[i].length; j++) {
      for (var k = j; k < runs[i].length-1; k++) {
        var e0 = runs[i][k]
        var e1 = runs[i][k+1]
        if (e0+1 !== e1) break
      }
      if (k > j+1) {
        var e0 = runs[i][j]
        var e1 = runs[i][k]
        result.push((e0+1)*2, (e1+1)*2+1)
        j = k
      } else {
        var e0 = runs[i][j]
        result.push((e0+1)*2)
      }
    }
  }
  return result
}

exports.unpack = function (packed) {
  var edges = [], runs = [edges]
  for (var i = 0; i < packed.length; i++) {
    var e = packed[i]
    if (e === 0) {
      edges = []
      runs.push(edges)
    } else if (e%2 === 0) {
      edges.push(Math.floor(e/2)-1)
    } else {
      var e0 = edges[edges.length-1]+1
      var e1 = Math.floor(e/2)-1
      for (var e = e0; e <= e1; e++) {
        edges.push(e)
      }
    }
  }
  return runs
}
