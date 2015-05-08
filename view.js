import { ccw } from './delaunay.js'

export default class DelaunayCanvas {
  constructor(canvas, tri, viewport) {
    this.canvas = canvas
    this.height = canvas.height
    this.width = canvas.width
    this.tri = tri
    this.viewport = viewport
    let cx = this.cx = canvas.getContext('2d')
    if (cx == null) {
      throw new Error('Failed to get context')
    }

    // Set default canvas styles
    this.cx.fillStyle = 'transparent'
    this.cx.strokeStyle = 'red'
    this.cx.lineJoin = 'bevel'
  }

  coords(x, y) {
    let height = this.height
    let width = this.width
    let viewport = this.viewport
    let scale = [width / viewport[2], height / viewport[3]]

    if (y == null) {
      y = x.p[1]
      x = x.p[0]
    }

    return [
      (x - viewport[0]) * scale[0],
      height - ((y - viewport[1]) * scale[1])
    ]
  }

  clear() {
    this.cx.clearRect(0, 0, this.width, this.height)
  }

  drawDelaunay(opts) {
    let tris = this.tri.tris
    let cx = this.cx
    let dx, dy, x, y

    opts = opts || {}
    opts.clear = opts.clear == null ? true : opts.clear
    opts.ghosts = opts.ghosts == null ? false : opts.ghosts
    let before = opts.before || function (){}
    let after = opts.after || function (){}

    if (opts.clear) {
      this.clear()
    }

    for (let i = 0, len = tris.length; i < len; i++) {
      let t = tris[i]
      let v2 = t.v[2]

      before.call(this, t, i)

      // if we have a ghost triangle draw it with a dashed line

      if (v2 == null) {
        if (!opts.ghosts) {
          continue
        }

        cx.setLineDash([4])
        dx = t.v[1].p[0] - t.v[0].p[0]
        dy = t.v[1].p[1] - t.v[0].p[1]

        x = t.v[0].p[0] + dx/2
        y = t.v[0].p[1] + dy/2
        v2 = { p: [-dy/6 + x, dx/6 + y] }
      }
      cx.beginPath()
      cx.moveTo.apply(cx, this.coords(t.v[0]))
      cx.lineTo.apply(cx, this.coords(t.v[1]))
      cx.lineTo.apply(cx, this.coords(v2))
      cx.lineTo.apply(cx, this.coords(t.v[0]))
      cx.fill()
      cx.stroke()

      if (t.v[2] == null) {
        cx.setLineDash([])
      }

      after.call(this, t, i)
    }
  }

  drawVoronoi(opts) {
    let verts = this.tri.verts
    let tris = this.tri.tris
    let circumcenters = this.tri.circumcenters
    let cx = this.cx

    opts = opts || {}
    opts.clear = opts.clear == null ? true : opts.clear
    let before = opts.before || function (){}
    let after = opts.after || function (){}

    if (circumcenters.length === 0) {
      this.tri.voronoi()
    }

    if (opts.clear) {
      this.clear()
    }

    for (let i = 0, len = verts.length; i < len; i++) {
      let v = verts[i]
      let t = v.t
      try {
        t = ccw(v)
        t = t.n[(t.v.indexOf(v)+2)%3]
      } finally {
        if (t.v[2] == null) {
          continue
        }
      }

      before.call(this, v, i)

      let torig = t
      let c = circumcenters[tris.indexOf(t)]
      cx.beginPath()
      cx.moveTo.apply(cx, this.coords(c))
      do {
        if (t.v.indexOf(v) < 0) {
          debugger
        }
        t = t.n[(t.v.indexOf(v)+2)%3]
        c = circumcenters[tris.indexOf(t)]
        if (c == null) {
          break
        }
        cx.lineTo.apply(cx, this.coords(c))
      } while (t !== torig)

      if (c == null) {
        c = circumcenters[tris.indexOf(torig)]
        cx.lineTo.apply(cx, this.coords(c))
      }

      cx.fill()
      cx.stroke()

      after.call(this, v, i)
    }
  }

  drawVerts(text) {
    let verts = this.tri.verts
    let cx = this.cx
    let ps = 3

    for (let i = 0, len = verts.length; i < len; i++) {
      let [x, y] = this.coords(verts[i])

      cx.fillRect(x-ps/2, y-ps/2, ps, ps)
      if (text) {
        cx.fillText('v['+i+']', x+10, y+10)
      }
    }
  }

  drawTree() {
    let cx = this.cx
    let viewport = this.viewport
    let verts = this.tri.verts
    let lines = []

    function getTree(ar, j, p, r, top, right, bot, left) {
      if (p >= r) {
        return
      }

      let e = j & 1
      let q = (p+r) >> 1
      let m = ar[q]
      let x = m.p[0]
      let y = m.p[1]

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
    getTree(verts, 0, 0, verts.length-1, 0, viewport[2], viewport[3], 0)

    for (let i = 0, len = lines.length; i < len; i++) {
      let l = lines[i]
      cx.beginPath()
      cx.moveTo.apply(cx, this.coords(l.xs[0], l.ys[0]))
      cx.lineTo.apply(cx, this.coords(l.xs[1], l.ys[1]))
      cx.fill()
      cx.stroke()
    }
  }
}
