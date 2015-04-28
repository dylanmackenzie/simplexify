/* jshint esnext: true */

import { partition } from './median'

var global = (1,eval)('this')
if (!global.debug) {
  global.debug = function () {}
}

// Triangulation computes the Delaunay triangulation for a given set of
// points. It accepts an array of objects which have both an x and a y
// property whose values are numbers.name
//
// verts is an array of objects with an array containing the x and y
// coordinates (p) and a pointer to a triangle (t) in the corresponding
// tris array which contains this vertex.
//
// tris is an array of objects containing two sub-arrays:
// v contains three pointers representing the vertices
// of the triangle in counter-clockwise order.
// n contains pointers to the triangles which share edges with it.
// Neighbors are ordered such that n[0] shares the edge opposite to
// v[0].
//
// tree is a flattened 2d tree used for efficiently selecting which
// groups to merge
export default Triangulation
function Triangulation(points) {

  var verts = this.verts = new Array(points.length)
  points.forEach(function (p, i) {
    verts[i] = { p: [p.x, p.y], t: null }
  })

  this.tris = []
}

// Helper function for printing triangles
Triangulation.prototype.tri = function (t) {
  var verts = this.verts
  return t.v.map(function (v) {
    return verts.indexOf(v)
  }).toString()
}

// delaunay sorts the vertices into a 2d-tree and solves the Delaunay
// Triangulation for those vertices
Triangulation.prototype.delaunay = function () {
  sort2d(this.verts, 0, 0, this.verts.length - 1)
  this.solve(0, 0, this.verts.length - 1)
}

// sort2d is called recursively to sort an array of vertices into a
// 2d-tree. j is the current depth, and p and r are the start and end
// indexes respectively
export function sort2d(ar, j, p, r) {
  if (p >= r) {
    return
  }

  debug('sort2d', arguments)

  // q is the index of the midpoint of the array
  var q = (p+r) >> 1

  // partition the subset of the array around its median
  partition(ar, j, p, r)

  // recursively partition using the other coordinate
  sort2d(ar, j+1, p, q)
  sort2d(ar, j+1, q+1, r)
}

// solve is the recursive function actually responsible for computing
// the triangulation
Triangulation.prototype.solve = function (j, p, r) {
  var verts = this.verts

  debug('solve', arguments)

  if (r - p === 1) {
    this.createTriangle(verts[p], verts[r])
    return
  }

  // TODO: check for colinearity
  var cp
  if (r - p === 2) {
    // order points in ccw fashion
    cp = cross(verts[p], verts[p+1], verts[r])
    if (cp < 0) {
      this.createTriangle(verts[p], verts[p+1], verts[r])
    } else if (cp > 0) {
      this.createTriangle(verts[p], verts[r], verts[p+1])
    } else {
      throw new Error('colinear vertices')
    }

    return
  }

  var q = (r+p) >> 1

  this.solve(j+1, p, q)
  this.solve(j+1, q+1, r)

  // flip sides for merges at odd depths to ensure consistency in
  // algorithms using cwghost and ccwghost
  if (j & 1) {
    this.merge(j, q+1, r, p, q)
  } else {
    this.merge(j, p, q, q+1, r)
  }
}

// createTriangle creates a new triangle from a raw set of vertices. It
// is used only in the base case of the recursive merge. The vertices
// must be passed in in ccw order, and the neighbors will be populated
// with ghost triangles
Triangulation.prototype.createTriangle = function (v0, v1, v2) {
  // t refers to the real triangle (the one with no null vertices)
  var t, t1, t2, t3

  debug('createTriangle', arguments)

  if (v2 == null) {
    t1 = this.createGhost(v0, v1)
    t2 = this.createGhost(v1, v0)
    v0.t = v1.t = t1
    t1.n[0] = t1.n[1] = t1.n[2] = t2
    t2.n[0] = t2.n[1] = t2.n[2] = t1
  } else /* full triangle */ {
    t  = {v: [v0, v1, v2], n: new Array(3)}
    t1 = this.createGhost(v1, v0)
    t2 = this.createGhost(v2, v1)
    t3 = this.createGhost(v0, v2)
    v0.t = v1.t = v2.t = t
    t1.n[2] = t2.n[2] = t3.n[2] = t
    t.n[0] = t2
    t.n[1] = t3
    t.n[2] = t1
    t1.n[0] = t2.n[1] = t3
    t2.n[0] = t3.n[1] = t1
    t3.n[0] = t1.n[1] = t2
    this.tris.push(t)
  }
}

Triangulation.prototype.createGhost = function (v0, v1) {
  debug('createGhost', arguments)

  var t = {v: [v0, v1, null], n: new Array(3)}
  this.tris.push(t)

  return t
}

// merge merges the vertices specified by ls and the ones specified by
// rs into a delaunay triangulation.
Triangulation.prototype.merge = function (j, lp, lr, rp, rr) {
  debug('merge', arguments)

  var verts = this.verts
  var e = j & 1

  // topl and topr contain the vertices of the upper convex boundary
  // vl0 and vr0 are the vertices making up the current base edge. These
  // will be changed to reflect the new base edge as they move up
  var [vl0, vr0]  = boundary(verts, j, lp, lr, rp, rr)
  var [topr, topl] = boundary(verts, j, rp, rr, lp, lr)

  // Create ghost triangles on convex boundaries. tb will be constantly
  // updated as the merge moves upwards, ttop is only used at the end
  // when it is stored in the neighbor list of the last merged triangle.
  var tb = this.createGhost(vr0, vl0)
  var ttop = this.createGhost(topl, topr)
  var ttmp

  if (tb.v[1] === ttop.v[0]) {
    tb.n[0] = ttop
    ttop.n[1] = tb
  } else {
    ttmp = ccwghost(vl0)
    ttmp.n[1] = tb
    tb.n[0] = ttmp
    ttmp = cwghost(topl)
    ttmp.n[0] = ttop
    ttop.n[1] = ttmp
  }

  if (tb.v[0] === ttop.v[1]) {
    tb.n[1] = ttop
    ttop.n[0] = tb
  } else {
    ttmp = cwghost(vr0)
    ttmp.n[0] = tb
    tb.n[1] = ttmp
    ttmp = ccwghost(topr)
    ttmp.n[1] = ttop
    ttop.n[0] = ttmp
  }

  // vl1 and vr1 are the cantidate vertices for the next merge step
  var vl1, vr1

  // tl and tr are ghost triangles which connect vl1 and vr1 to the base
  // vertices
  var tl = cwghost(vl0)
  var tr = ccwghost(vr0)

  // t is the triangle that has been newly created by the merge
  // iteration. It is the starting point for flip propagation
  var t

  // useLeftGhost is a boolean which decides which region we use in the
  // next phase of the merge we. The rest are temporary storage for
  // computing useLeftGhost
  var useLeftGhost, langle, rangle, lrangle

  // Move upward between the regions, merging them as we go. Exit when
  // we reach the top edge
  while (!(vl0 === topl && vr0 === topr)) {
    debug('merge step', [verts.indexOf(vl0), verts.indexOf(vr0)])

    // tl and tr are the ghost triangles which can be mated with the
    // opposite region
    // set vl1 and vr1 to the other vertex of the cantidate ghost
    // triangle
    vl1 = tl.v[0]
    vr1 = tr.v[1]

    // Merge using the cantidate vertex with the lowest angle above the
    // line connecting the two base vertices (we want to pick the o in
    // the following diagram):
    //       vl1
    //        x
    //       /  .
    //      / vr1 .
    //     /    o_  .
    //    /       ———_.
    //   .------------——.
    //  vl0            vr0
    rangle = angle(vr1, vr0, vl0)
    langle = angle(vr0, vl0, vl1)
    useLeftGhost = rangle > langle
    if (useLeftGhost) {
      lrangle = angle(vl1, vr0, vl0)
      if (lrangle > rangle) {
        useLeftGhost = false
      }
    } else {
      lrangle = angle(vr0, vl0, vr1)
      if (lrangle > langle) {
        useLeftGhost = true
      }
    }

    if (useLeftGhost) {
      // mate the left ghost with the right base vertex
      t = mateghost(tl, vr0, tb)

      // flip_p2(t, index(t, v R0 )) and set t = mccwt(v L1 ).
      // flipP2(t, t.v.indexOf(vr0))
      // t = mccwt(vl1)

      // If t base ≠ø then mate(t, t base ), flip_p4(t, index(t, t base )),
      // t = mccwt(v L1 ).
      // if (tb != null) {
        // mate(t, tb)
        // flipP4(t, t.n.indexOf(tb))
        // t = mccwt(vl1)
      // }

      // Move base up by one vertex
      vl0 = vl1
      tl = cwghost(vl0)

    } else /* right triangle */{
      // mate the right ghost with the left base vertex
      t = mateghost(tr, vl0, tb)

      // flip_p2(t, index(t, v L0 )) and set t = mcwt(v R1 ).
      // flipP2(t, t.v.indexOf(vl0))
      // t = mcwt(vr1)

      // If t base ≠ø then mate(t, t base ), flip_p4(t, index(t, t base )),
      // and set t = mcct(v R1 ).
      // if (tb != null) {
        // mate(t, tb)
        // flipP4(t, t.n.indexOf(tb))
        // t = mcwt(vr1)
      // }

      // Move base up by one vertex and go to next ghost triangle
      vr0 = vr1
      tr = ccwghost(vr0)
    }

    // update the relevant trangles for next merge step
    tb = t
  }

  // We are now at the top of the merge so add the ghost triangle at the
  // upper convex boundary to the neighbors of t to complete the merge
  ttop.n[2] = t
  for (var i = 0; i < 3; i++) {
    if (ttop.v.indexOf(t.v[i]) === -1) {
      t.n[i] = ttop
      break
    }
  }
}

// flip performs an edge flip between triangle t and t.n[i] (the ith
// neighbor of t)
function flip(t, i) {
  debug('flip', arguments)

  // u is the neighbor to be flipped with
  var u = t.n[i]

  // j is the position of t in neighbors of u
  var j = u.n.indexOf(t)

  // cache index math
  var i1 = (i+1)%3
  var i2 = (i+2)%3
  var j1 = (j+1)%3
  var j2 = (j+2)%3

  // change ownership of vertices if needed
  if (t.v[i1].t === t) {
    t.v[i1].t = u
  }
  if (u.v[j1].t === u) {
    u.v[j1].t = t
  }

  // swap vertices
  t.v[i1] = u.v[j]
  u.v[j1] = t.v[i]

  // swap neighbor not involved in flip
  var tmp = t.n[i2]
  t.n[i2] = u.n[j2]
  u.n[j2] = tmp

  // swap neighbor position of other triangle in flip
  u.n[j2] = t
  t.n[i2] = u
}

// flipP2 propogates flips in 2 directions
function flipP2(t, i) {
  // If tri(t 0 , i 0 )=ø then quit.
  var t1 = t.n[i]
  if (t1 != null) {
    return
  }

  debug('flipP2', arguments)

  // Set t 1 = tri(t 0 , i 0 ) and i 1 = index(t 1 , t 0 ).
  var i1 = t1.n.indexOf(t)

  // If vert(t 1 , i 1 ) is not included by the circumcircle of t 0 , quit.
  if (!inCircle(t, t1.v[i1])) {
    return
  }

  // Do flip(t 0 , i 0 ).
  flip(t, i)

  // Call flip_p2(edge(t 0 , i 0 )).
  flipP2(t, i)

  // Call flip_p2(edge(t 1 , i 1 +1)).
  flipP2(t1, (i1+1)%3)

}

// flipP4 propogates flips in 4 directions
function flipP4(t, i) {
  // If tri(t 0 , i 0 ) = ø or t 0 ≠ (v 0 , v 1 , v 2 ) then quit.
  var t1 = t.n[i]
  if (t1 != null) {
    return
  }

  debug('flipP4', arguments)

  // Set t 1 = tri(t 0 , i 0 ) and i 1 = index(t 1 , t 0 ).
  var i1 = t1.n.indexOf(t)

  // If vert(t 1 , i 1 ) is not included by the circumcircle of t 0 , quit.
  if (!inCircle(t, t1.v[i1])) {
    return
  }

  // Do flip(t 0 , i 0 ).
  flip(t, i)

  // Set t a = (t 0 , i 0 ), t b = (t 1 , i 1 +1), t c = (t 1 , i 1 ),
  // and t d = (t 0 , i 0 +1).
  var ta = t.n[i]
  var tb = t1.n[(i1+1)%3]
  var tc = t1.n[i1]
  var td = t.n[(i+1)%3]

  // Call flip_p4(edge(t a , index(t a , t 0 ))
  // Call flip_p4(edge(t b , index (t b , t 1 ))
  // Call flip_p4(edge(t c , index(t c , t 1 ))
  // Call flip_p4(edge(t d , index(t d , t 0 ))
  flipP4(ta, i)
  flipP4(tb, (i1+1)%3)
  flipP4(tc, i1)
  flipP4(td, (i+1)%3)

}

export function isghost(t) {
  return t.v[2] == null
}

export function ccwghost(v) {
  debug('ccwghost', arguments)

  var t = v.t
  var i = 0 // detect infinite loops during debugging

  // If the vertex's triangle is already a ghost, we need to see if we
  // are on the correct side. If so, we return immediately.
  if (isghost(t) && t.v.indexOf(v) === 0) {
    return t
  }

  do {
    t = t.n[(t.v.indexOf(v)+1)%3]
    if (i++ > 1000) {
      throw new Error('ccwghost called on triangle not on boundary')
    }
  } while (!isghost(t))

  return t
}

// cwghost starts at the triangle referenced by v and iterates clockwise
// around the triangles which contain v until it finds a ghost triangle
export function cwghost(v) {
  debug('cwghost', arguments)

  var t = v.t
  var i = 0 // detect infinite loops during debugging

  // If the vertex's triangle is a ghost, we need to immediately check
  // if we are on the correct side. If so, we return.
  if (isghost(t) && t.v.indexOf(v) === 1) {
    return t
  }

  do {
    t = t.n[(t.v.indexOf(v)+2)%3]
    if (i++ > 1000) {
      throw new Error('cwghost called on triangle not on boundary')
    }
  } while (!isghost(t))

  return t
}

// mateghost turns a ghost triangle (t) into a real triangle by linking
// it to vertex (v) and linking it with the triangle below it (tb)
export function mateghost(t, v, tb) {
  debug('mateghost', arguments)

  t.v[2] = v

  for (var i = 0; i < 3; i++) {
    if (tb.v.indexOf(t.v[i]) === -1) {
      t.n[i] = tb
    }
    if (t.v.indexOf(tb.v[i]) === -1) {
      tb.n[i] = t
    }
  }

  return t
}

// inCircle returns true if v is in the circumcircle of t
export function inCircle(t, v) {
  var [ a, b, c ] = t.v
  var [ ax, ay ] = a.p
  var [ bx, by ] = b.p
  var [ cx, cy ] = c.p
  var [ vx, vy ] = v.p

  // algorithm from wikipedia
  var d = 2*(ax*(by-cy) + bx*(cy-ay) + cx*(ay-by))
  var am = ax*ax+ay*ay
  var bm = bx*bx+by*by
  var cm = cx*cx+cy*cy
  var ux = (am*(by-cy) + bm*(cy-ay) + cm*(ay-by))/d
  var uy = (am*(cx-bx) + bm*(ax-cx) + cm*(bx-ax))/d
  var ur = (ux-ax)*(ux-ax) + (ux-ay)*(ux-ay)
  var vr = (ux-vx)*(ux-vx) + (ux-vy)*(ux-vy)

  return ur > vr
}

export function boundary(ar, j, lp, lr, rp, rr) {
  debug('boundary', arguments)

  var e = j & 1

  // Let l be the rightmost point of lp-lr
  // Let r be the leftmost point of rp-rr
  // TODO: use the tree to find minimums
  var l, r
  if (lp < rp) {
    l = findMax(ar, 0, e, lp, lr)
    r = findMin(ar, 0, e, rp, rr)
  } else {
    l = findMin(ar, 0, e, lp, lr)
    r = findMax(ar, 0, e, rp, rr)
  }

  var tl = ccwghost(l)
  var tr = cwghost(r)
  var check = 0

  var v, bx, by, vx, vy
  for (;;) {

    // move l clockwise until it is a tangent to the right side
    v = tl.v[1]
    while (cross(r, l, v) > 0) {
      l = v
      tl = tl.n[0]
      v = tl.v[1]
      check = 0
    }

    if (++check === 2) {
      debug('boundary done', [ar.indexOf(l), ar.indexOf(r)])
      return [l, r]
    }

    // move r counterclockwise until it is a tangent to the left side
    v = tr.v[0]
    while (cross(r, l, v) > 0) {
      r = v
      tr = tr.n[1]
      v = tr.v[0]
      check = 0
    }

    if (++check === 2) {
      debug('boundary done', [ar.indexOf(l), ar.indexOf(r)])
      return [l, r]
    }
  }
}

function findMin(ar, j, e, p, r) {
  var i, pos, min, minPos = Infinity
  for (i = p; i <= r; i++) {
    pos = ar[i].p[e]
    if (pos < minPos) {
      minPos = pos
      min = ar[i]
    }
  }

  return min
}

function findMax(ar, j, e, p, r) {
  var i, pos, max, maxPos = -Infinity
  for (i = p; i <= r; i++) {
    pos = ar[i].p[e]
    if (pos > maxPos) {
      maxPos = pos
      max = ar[i]
    }
  }

  return max
}

// cross computes (v0-vs)x(v1-vs)
export function cross(v0, vs, v1) {
  var ux = v0.p[0] - vs.p[0]
  var uy = v0.p[1] - vs.p[1]
  var vx = v1.p[0] - vs.p[0]
  var vy = v1.p[1] - vs.p[1]
  return ux*vy - uy*vx
}

export function angle(v0, vs, v1) {
  var ux = v0.p[0] - vs.p[0]
  var uy = v0.p[1] - vs.p[1]
  var vx = v1.p[0] - vs.p[0]
  var vy = v1.p[1] - vs.p[1]
  var cross = ux*vy - uy*vx
  var dot = ux*vx + uy*vy

  if (cross === 0) {
    return dot > 0 ?  0 : Math.PI
  }

  var angle = Math.acos(dot / (Math.sqrt(ux*ux+uy*uy) * Math.sqrt(vx*vx+vy*vy)))

  return cross > 0 ? angle : 2*Math.PI - angle
}
