module.exports = function fixDepth(x) {
  var fixed = fixDepth_(x)
  for (var i = 0; i < fixed.length; i++) {
    for (var j = 0; j < fixed[i].length; j++) {
      if (fixed[i][j].length === 0) break
    }
    if (j !== fixed[i].length) {
      fixed[i] = fixed[i].filter((row) => row.length > 0)
    }
  }
  return fixed
}

function fixDepth_(x) {
  for (var d = 0, z = x; Array.isArray(z); z = z[0]) d++
  if (d === 2) {
    return [[x]]
  } else if (d === 3) {
    return [x]
  }
  return x
}
