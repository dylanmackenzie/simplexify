import { circumcenter } from './delaunay.js'

export default DelaunayCanvas
function DelaunayCanvas(canvas, tri, size) {
  this.canvas = canvas
  this.height = canvas.height
  this.width = canvas.width
  this.tri = tri
  this.size = size
  var cx = this.cx = canvas.getContext('2d')
  if (cx == null) {
    throw new Error('Failed to get context')
  }

  // Set default canvas style
  this.cx.fillStyle = 'transparent'
  this.cx.strokeStyle = 'red'
}

DelaunayCanvas.prototype.coords = function (x, y) {
  var height = this.height
  var width = this.width
  var size = this.size
  var scale = [width / size[0], height / size[1]]

  if (y == null) {
    y = x.p[1]
    x = x.p[0]
  }

  return [
    x * scale[0],
    height - (y * scale[1])
  ]
}

DelaunayCanvas.prototype.clear = function () {
  this.cx.clearRect(0, 0, this.width, this.height)
}

DelaunayCanvas.prototype.drawDelaunay = function (opts) {
  opts = opts || {}
  opts.triangles = opts.triangles == null ? true : opts.triangles
  opts.ghosts = opts.ghosts == null ? false : opts.ghosts
  opts.verts = opts.verts == null ? true : opts.verts
  opts.vertLabels = opts.vertLabels == null ? false : opts.vertLabels
  opts.tree = opts.tree == null ? false : opts.tree

  this.clear()

  if (opts.triangles) {
    this.drawTriangles(opts.ghosts)
  }
  if (opts.verts) {
    this.drawVerts(opts.vertLabels)
  }
  if (opts.tree) {
    this.drawTree()
  }
}

DelaunayCanvas.prototype.drawVoronoi = function (opts) {
  let tris = this.tri.tris
  var cx = this.cx
  var height = this.height
  var width = this.width
  var size = this.size

  opts = opts || {}
  opts.triangles = opts.triangles || true
  opts.ghosts = opts.ghosts || false
  opts.verts = opts.verts || true
  opts.vertLabels = opts.verts || false
  opts.tree = opts.tree || false

  this.clear()

  for (let i = 0, len = tris.length; i < len; i++) {
    let t = tris[i]
    if (t.v[2] == null) {
      continue
    }
    let c = { p: circumcenter(t) }
    for (let j = 0; j < 3; j++) {
      if (t.n[j].v[2] == null) {
        continue
      }
      let nc = { p: circumcenter(t.n[j]) }
      cx.beginPath()
      cx.moveTo.apply(cx, this.coords(c))
      cx.lineTo.apply(cx, this.coords(nc))
      cx.stroke()
    }
  }
}

DelaunayCanvas.prototype.drawTriangles = function (ghosts) {
  var tris = this.tri.tris
  var cx = this.cx
  var width = this.width
  var height = this.height
  var v2 = tri.v[2]
  var dx, dy, x, y

  for (var i = 0, len = tris.length; i < len; i++) {
    if (!ghosts && tris[i].v[2] == null) {
      continue
    }

    // if we have a ghost triangle draw it with a dashed line
    if (v2 == null) {
      cx.setLineDash([4])
      dx = tri.v[1].p[0] - tri.v[0].p[0]
      dy = tri.v[1].p[1] - tri.v[0].p[1]

      x = tri.v[0].p[0] + dx/2
      y = tri.v[0].p[1] + dy/2
      v2 = { p: [-dy/6 + x, dx/6 + y] }
    } else {
      cx.setLineDash([])
    }

    cx.beginPath()
    cx.moveTo.apply(cx, this.coords(tri.v[0]))
    cx.lineTo.apply(cx, this.coords(tri.v[1]))
    cx.lineTo.apply(cx, this.coords(v2))
    cx.lineTo.apply(cx, this.coords(tri.v[0]))
    cx.stroke()
    cx.fill()
  }
}

DelaunayCanvas.prototype.drawVerts = function (text) {
  var verts = this.tri.verts
  var cx = this.cx
  var width = this.width
  var height = this.height
  var ps = 3

  for (var i = 0, len = verts.length; i < len; i++) {
    var [x, y] = this.coords(v)

    cx.fillRect(x-ps/2, y-ps/2, ps, ps)
    if (text) {
      cx.fillText('v['+i+']', x+10, y+10)
    }
  }
}

DelaunayCanvas.prototype.drawEdge = function (v1, v2) {
  var verts = this.tri.verts

  if (typeof v1 === 'number') {
    v1 = verts[v1]
    v2 = verts[v2]
  }
}

DelaunayCanvas.prototype.drawTree = function () {
  var cx = this.cx
  var height = this.height
  var width = this.width
  var size = this.size
  var verts = this.tri.verts
  var lines = []

  function getTree(ar, j, p, r, top, right, bot, left) {
    if (p >= r) {
      return
    }

    var e = j & 1
    var q = (p+r) >> 1
    var m = ar[q]
    var x = m.p[0]
    var y = m.p[1]

    if (e) {
      lines.push({xs: [left, right], ys: [y, y]})
    } else {
      lines.push({xs: [x, x], ys: [top, bot]})
    }

    if (e) {
      getTree(ar, j+1, p, q-1, top, right, y, left)
      getTree(ar, j+1, q+1, r, y, right, bot, left)
    } else {
      getTree(ar, j+1, p, q-1, top, x, bot, left)
      getTree(ar, j+1, q+1, r, top, right, bot, x)
    }
  }

  // initiate recursion
  getTree(verts, 0, 0, verts.length-1, 0, size[0], size[1], 0)

  var l
  for (var i = 0, len = lines.length; i < len; i++) {
    l = lines[i]
    cx.beginPath()
    cx.moveTo.apply(cx, this.coords(l.xs[0], l.ys[0]))
    cx.lineTo.apply(cx, this.coords(l.xs[1], l.ys[1]))
    cx.stroke()
    cx.fill()
  }
}
