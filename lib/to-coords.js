module.exports = function (obj) {
  var coordinates = []
  addCoords(coordinates, obj)
  return coordinates
}

function addCoords(coordinates, obj) {
  if (obj.type === 'FeatureCollection') {
    for (var i = 0; i < obj.features.length; i++) {
      addCoords(coordinates, obj.features[i])
    }
  } else if (obj.type === 'Feature' && obj.geometry && obj.geometry.type === 'Polygon') {
    coordinates.push(obj.geometry.coordinates)
  } else if (obj.type === 'Feature' && obj.geometry && obj.geometry.type === 'MultiPolygon') {
    coordinates.push.apply(coordinates, obj.geometry.coordinates)
  }
}
