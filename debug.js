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
for (var i = 0; i < 1000; i++) {
  points.push({x: Math.random(), y: Math.random()})
}

var tri = window.tri = new Triangulation(points)
var view = window.view = new View(canvas, tri, size)

window.checkNeighbors = function () {
  tri.tris.forEach(function (t) {
    if (t.v[2] == null) {
      return
    }
    t.n.forEach(function (ne) {
      if (ne == null) {
        return
      }
      let count = 0
      t.v.forEach(function (v) {
        if (ne.v.indexOf(v) < 0) {
          count++
        }
      })
      if (count !== 1) {
        console.log('Error in ' + tri.tri(t))
      }
    })
  })
}

window.debug = function(f, args) {
  switch (f) {
    case 'boundary':
    case 'boundary done':
      break
    case 'merge step':
    case 'merge':
      view.clear()
      view.drawVerts(true)
      view.drawTriangles(true)
      debugger
      break
    case 'ccwghost':
    case 'cwghost':
      break
    case 'mateghost':
      console.log(f)
      console.log(tri.tri(args[0]))
      console.log(tri.verts.indexOf(args[1]))
      console.log(tri.tri(args[2]))
      break
    case 'flipP2':
    case 'flipP4':
      break
    case 'flip':
      console.log(f, [].slice.call(args, 0))
      view.clear()
      view.drawVerts(true)
      view.drawTriangles(true)
      debugger
      break
  }
}

window.debug = function(){}

view.drawVerts()
try {
  tri.delaunay()
} catch(e) {
  console.log(e)
}
view.clear()
view.drawVerts()
view.drawTriangles()
console.log(points)

