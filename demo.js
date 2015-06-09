import View from './view'
import Triangulation from './delaunay'

let canvas = document.querySelector('canvas')

let viewport = [0, 0, 1, 1]
let points = [
  { x: 0, y: 0.00001 },
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
]
for (let i = 0; i < 500; i++) {
  points.push({x: Math.random(), y: Math.random()})
}

let tri = window.tri = new Triangulation(points)
let view = window.view = new View(canvas, tri, viewport)

window.debug = function(){}

tri.delaunay()
tri.voronoi()
view.cx.lineWidth = 1
view.cx.strokeStyle = 'white'

let lastv = tri.verts[0]
let colors = window.colors = new WeakMap()
tri.verts.forEach(function (v) {
  let r = Math.floor(Math.random()*0x7f).toString(16)
  let g = Math.floor(Math.random()*0x7f).toString(16)
  let b = Math.floor(Math.random()*0x7f+0x80).toString(16)
  let color = ('00'+r).slice(-2) + ('00'+g).slice(-2) + ('00'+b).slice(-2)
  colors.set(v, '#'+color)
})

canvas.addEventListener('mousemove', function (e) {
  lastv[0] = e.offsetX / e.target.width
  lastv[1] = (e.target.height - e.offsetY) / e.target.height
  lastv[0] = lastv[0] * view.viewport[2] + view.viewport[0]
  lastv[1] = lastv[1] * view.viewport[3] + view.viewport[1]

  tri.delaunay()
  tri.voronoi()

  view.drawVoronoi({
    before: function (v) {
      let color = 'red'
      if (colors.has(v) && v !== lastv) {
        color = colors.get(v)
      }
      this.cx.fillStyle = color
    }
  })
})

view.drawVoronoi({
  before: function (v) {
    let color = colors.get(v)
    this.cx.fillStyle = color
  }
})

