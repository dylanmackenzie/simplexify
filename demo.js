import View from './view'
import Triangulation from './delaunay'

let canvas = document.querySelector('canvas')

let viewport = [.15, .15, .7, .7]
let points = []
for (let i = 0; i < 400; i++) {
  points.push({x: Math.random(), y: Math.random()})
}
let tri = window.tri = new Triangulation(points)
let view = window.view = new View(canvas, tri, viewport)

window.debug = function(){}

tri.delaunay()
tri.voronoi()
view.cx.lineWidth = 2
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
  lastv.p[0] = e.offsetX / e.target.width
  lastv.p[1] = (e.target.height - e.offsetY) / e.target.height
  lastv.p[0] = lastv.p[0] * view.viewport[2] + view.viewport[0]
  lastv.p[1] = lastv.p[1] * view.viewport[3] + view.viewport[1]

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

