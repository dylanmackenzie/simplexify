import View from './view'
import Triangulation from './delaunay'

var canvas = document.querySelector('canvas')
var points = [
    [5, 9], [1, 8], [2.8, 5.4], [4, 1],
    [7.5, 4], [3, 7], [6, 3], [7, 2], [9, 6]
]
var size = [10, 10]
var points = points.map(function (p) { return {x: p[0], y: p[1]} })

size = [1, 1]
points = []
for (var i = 0; i < 100; i++) {
  points.push({x: Math.random(), y: Math.random()})
}

var tri = window.tri = new Triangulation(points)
var view = window.view = new View(canvas, tri, size)

window.debug = function(f, args) {
  switch (f) {
    case 'boundary':
      console.log('boundary', [].slice.call(args, 0))
      break
    case 'boundary done':
      console.log('boundary done', [].slice.call(args, 0))
      break
    case 'merge step':
    case 'merge':
      view.clear()
      view.drawVerts()
      view.drawTriangles(true)
      debugger
      break
    case 'ccwghost':
    case 'cwghost':
      break
    case 'mateghost':
      break
  }
}

view.drawVerts()
try {
  tri.delaunay()
} catch(e) {
  console.log(e)
  console.log(points)
}
view.clear()
view.drawVerts()
view.drawTriangles()

