/* global debug */

import { partition } from './median'

const π = Math.PI

let global = (1, eval)('this')
if (!global.debug) {
  global.debug = function () {}
}

// Delaunay computes the Delaunay triangulation for a given set of
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
export default class Delaunay {

  constructor(points) {
    let verts = this.verts = new Array(points.length)
    points.forEach(function (p, i) {
      verts[i] = [p.x, p.y, null]
    })

    this.tris = []
    this.circumcenters = []
  }

  // Helper function for printing triangles
  tri(t) {
    let verts = this.verts
    let vertLookup = function vertString(v) {
      return verts.indexOf(v)
    }

    let s = t.slice(0, 3).map(vertLookup).toString()

    s += ' --> '
    s += t.slice(3, 6).map(function (tn) {
      if (tn == null) {
        return 'null'
      }
      return tn.slice(0, 3).map(vertLookup).toString()
    }).join('; ')

    return s
  }

  // delaunay sorts the vertices into a 2d-tree and solves the Delaunay
  // Triangulation for those vertices.
  delaunay() {
    if (this.verts.length < 3) {
      throw new Error('Delaunay Triangulation needs at least three vertices')
    }

    let is_success = false
    for (let tries = 0; !is_success && tries < 10; tries++) {
      this.tris = []
      sort2d(this.verts, 0, 0, this.verts.length - 1)
      is_success = this.solve(0, 0, this.verts.length - 1)
    }

    if (!is_success) {
      throw new Error('Collinear vertices could not be resolved')
    }
  }

  // voronoi computes the circumcenters of every triangle in the
  // triangulation. It calls delaunay() if no triangles exist.
  voronoi() {
    let tris = this.tris

    this.circumcenters = []

    if (tris.length === 0) {
      this.delaunay()
    }

    for (let i = 0, len = tris.length; i < len; i++) {
      if (isghost(tris[i])) {
        this.circumcenters[i] = null
      } else {
        this.circumcenters[i] = { p: circumcenter(tris[i]) }

      }
    }
  }

  // solve is the recursive function actually responsible for computing
  // the triangulation
  solve(j, p, r) {
    let verts = this.verts

    debug('solve', arguments)

    if (r - p === 1) {
      this.createTriangle(verts[p], verts[r])
      return true
    }

    if (r - p === 2) {
      // If we have collinear vertices, smudge their coordinates.
      // TODO: implement floating point nextAfter: these small deltas might
      // round to 0 if the coordinates are large enough.
      let cp = cross(verts[p], verts[p+1], verts[r])
      let tries = 0
      while (cp === 0 && tries < 10) {
        const sigma = 1e-5;
        verts[p][0]   += 2*sigma*Math.random() - sigma
        verts[p][1]   += 2*sigma*Math.random() - sigma
        verts[p+1][0] += 2*sigma*Math.random() - sigma
        verts[p+1][1] += 2*sigma*Math.random() - sigma
        verts[r][0]   += 2*sigma*Math.random() - sigma
        verts[r][1]   += 2*sigma*Math.random() - sigma

        cp = cross(verts[p], verts[p+1], verts[r])
        ++tries
      }

      // order points in ccw fashion
      if (cp < 0) {
        this.createTriangle(verts[p], verts[p+1], verts[r])
      } else if (cp > 0) {
        this.createTriangle(verts[p], verts[r], verts[p+1])
      } else {
        // If all else fails, throw an exception
        throw new Error('Collinear vertices could not be resolved')
      }

      return tries == 0
    }

    let q = (r+p) >> 1

    let success = true
    success = this.solve(j+1, p, q)
    success = this.solve(j+1, q+1, r) && success
    if (!success) return false

    // flip sides for merges at odd depths to ensure consistency in
    // algorithms using cw and ccw
    if (j & 1) {
      this.merge(j, q+1, r, p, q)
    } else {
      this.merge(j, p, q, q+1, r)
    }

    return true
  }

  // createTriangle creates a new triangle from a raw set of vertices. It
  // is used only in the base case of the recursive merge. The vertices
  // must be passed in in ccw order, and the neighbors will be populated
  // with ghost triangles
  createTriangle(v0, v1, v2) {

    debug('createTriangle', arguments)

    if (v2 == null) {
      let t1 = this.createGhost(v0, v1)
      let t2 = this.createGhost(v1, v0)
      v0[2] = v1[2] = t1
      t1[3] = t1[4] = t1[5] = t2
      t2[3] = t2[4] = t2[5] = t1
    } else /* full triangle */ {
      let t1 = this.createGhost(v1, v0)
      let t2 = this.createGhost(v2, v1)
      let t3 = this.createGhost(v0, v2)

      // t refers to the real triangle (the one with no null vertices)
      let t = [v0, v1, v2, t1, t2, t3]
      v0[2] = v1[2] = v2[2] = t
      t1[5] = t2[5] = t3[5] = t
      t[3] = t2
      t[4] = t3
      t[5] = t1
      t1[3] = t2[4] = t3
      t2[3] = t3[4] = t1
      t3[3] = t1[4] = t2
      this.tris.push(t)
    }
  }

  createGhost(v0, v1) {
    debug('createGhost', arguments)

    let t = [v0, v1, null, null, null, null]
    this.tris.push(t)

    return t
  }

  // merge merges the vertices specified by ls and the ones specified by
  // rs into a delaunay triangulation.
  merge(j, lp, lr, rp, rr) {
    debug('merge', arguments)

    let verts = this.verts

    // topl and topr contain the vertices of the upper convex boundary
    // vl0 and vr0 are the vertices making up the current base edge. These
    // will be changed to reflect the new base edge as they move up
    let [vl0, vr0] = boundary(verts, j, lp, lr, rp, rr)
    let [topr, topl] = boundary(verts, j, rp, rr, lp, lr)

    // Create ghost triangles on convex boundaries. tb will be constantly
    // updated as the merge moves upwards, ttop is only used at the end
    // when it is stored in the neighbor list of the last merged triangle.
    let tb = this.createGhost(vr0, vl0)
    let ttop = this.createGhost(topl, topr)
    let ttmp

    if (tb[1] === ttop[0]) {
      tb[3] = ttop
      ttop[4] = tb
    } else {
      ttmp = ccw(vl0)
      ttmp[4] = tb
      tb[3] = ttmp
      ttmp = cw(topl)
      ttmp[3] = ttop
      ttop[4] = ttmp
    }

    if (tb[0] === ttop[1]) {
      tb[4] = ttop
      ttop[3] = tb
    } else {
      ttmp = cw(vr0)
      ttmp[3] = tb
      tb[4] = ttmp
      ttmp = ccw(topr)
      ttmp[4] = ttop
      ttop[3] = ttmp
    }

    // vl1 and vr1 are the cantidate vertices for the next merge step
    let vl1, vr1

    // tl and tr are ghost triangles which connect vl1 and vr1 to the base
    // vertices
    let tl = cw(vl0)
    let tr = ccw(vr0)

    // t is the triangle that has been newly created by the merge
    // iteration. It is the starting point for flip propagation
    let t

    // useLeftGhost is a boolean which decides which region we use in the
    // next phase of the merge we. The rest are temporary storage for
    // computing useLeftGhost
    let useLeftGhost, langle, rangle, lrangle

    // Move upward between the regions, merging them as we go. Exit when
    // we reach the top edge
    while (!(vl0 === topl && vr0 === topr)) {
      debug('merge step', [verts.indexOf(vl0), verts.indexOf(vr0)])

      // tl and tr are the ghost triangles which can be mated with the
      // opposite region
      // set vl1 and vr1 to the other vertex of the cantidate ghost
      // triangle
      vl1 = tl[0]
      vr1 = tr[1]

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
        if (lrangle >= rangle) {
          useLeftGhost = false
        }
      } else {
        lrangle = angle(vr0, vl0, vr1)
        if (lrangle >= langle) {
          useLeftGhost = true
        }
      }

      if (useLeftGhost) {
        // mate the left ghost with the right base vertex
        t = mateghost(tl, vr0, tb)
        t[4] = null

        // Move base up by one vertex
        vl0 = vl1
        tl = cw(vl0)

        flipP4(t, 2, t[0], t[1], t[2])
        flipP4(t, 1, t[0], t[1], t[2])
        flipP4(t, 0, t[0], t[1], t[2])

        t = ccw(vl0)

      } else /* right triangle */{
        // mate the right ghost with the left base vertex
        t = mateghost(tr, vl0, tb)
        t[3] = null

        // Move base up by one vertex and go to next ghost triangle
        vr0 = vr1
        tr = ccw(vr0)

        flipP4(t, 2, t[0], t[1], t[2])
        flipP4(t, 1, t[0], t[1], t[2])
        flipP4(t, 0, t[0], t[1], t[2])

        t = cw(vr0)
      }

      // update the relevant trangles for next merge step
      tb = t
    }

    // We are now at the top of the merge so add the ghost triangle at the
    // upper convex boundary to the neighbors of t and propagate flips to
    // complete the merge
    ttop[5] = t
    for (let i = 0; i < 3; i++) {
      if (ttop.indexOf(t[i]) < 0) {
        t[i+3] = ttop
        break
      }
    }
    flipP4(t, 2, t[0], t[1], t[2])
    flipP4(t, 1, t[0], t[1], t[2])
    flipP4(t, 0, t[0], t[1], t[2])
  }
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
  let q = (p+r) >> 1
  let e = j & 1

  // partition the subset of the array around its median
  partition(ar, e, p, r)

  // recursively partition using the other coordinate
  sort2d(ar, j+1, p, q)
  sort2d(ar, j+1, q+1, r)
}

// flip performs an edge flip between triangle t and the ith
// neighbor of t
export function flip(t, i) {
  debug('flip', arguments)

  // u is the neighbor to be flipped with
  let u = t[i+3]

  // j is the position of t in neighbors of u
  let j = u.indexOf(t) - 3

  // cache index math
  let i1 = (i+1)%3
  let i2 = (i+2)%3
  let j1 = (j+1)%3
  let j2 = (j+2)%3

  // swap vertices
  t[i1] = u[j]
  u[j1] = t[i]

  // ensure ccw ordering if necessary
  if (cross(t[i], t[i1], t[i2]) > 0) {
    let tmp = t[i1]
    t[i1] = t[i2]
    t[i2] = tmp
    let tmpi = i1
    i1 = i2
    i2 = tmpi
  }
  if (cross(u[j], u[j1], u[j2]) > 0) {
    let tmp = u[j1]
    u[j1] = u[j2]
    u[j2] = tmp
    let tmpj = j1
    j1 = j2
    j2 = tmpj
  }

  // change ownership of vertices if needed
  if (t[i2][2] === u) {
    t[i2][2] = t
  }
  if (u[j2][2] === t) {
    u[j2][2] = u
  }

  // swap neighbor not involved in flip
  t[i+3] = u[j2+3]
  u[j+3] = t[i2+3]
  if (t[i+3] != null) {
    if (t[i+3][2] == null) {
      t[i+3][5] = t
    } else {
      t[i+3][t[i+3].indexOf(u)] = t
    }
  }
  if (u[j+3] != null) {
    if (u[j+3][2] == null) {
      u[j+3][5] = u
    } else {
      u[j+3][u[j+3].indexOf(t)] = u
    }
  }

  // swap neighbor position of other triangle in flip
  u[j2+3] = t
  t[i2+3] = u
}

// flipP2 flips the edge across from the i'th vertex of t and propagates
// in two directions
function flipP2(t, i) {
  debug('flipP2', arguments)

  // If the ith neighbor of t is a ghost triangle or doesn't exist, we
  // are done propagating
  let t1 = t[i+3]
  if (t1 == null || isghost(t1)) {
    return
  }

  // i1 is the index of our triangle in the other triangle
  let i1 = t1.indexOf(t) - 3
  if (i1 < 0) {
    throw new Error('Bad triangulation')
  }

  // If the opposite vertex of the neighboring triangle is not in the
  // circumcircle of the current triangle, there is no need to flip and
  // we are done
  if (!inCircle(t, t1[i1])) {
    return
  }

  flip(t, i)
  flipP2(t, i)
  flipP2(t1, (i1+1)%3)

}

// flipP4 flips the edge between t and the ith neighbor of t and
// propagates flips in 4 directions
function flipP4(t, i, v0, v1, v2) {
  debug('flipP4', arguments)

  // If neighboring triangle is a ghost, does not exist, or has already
  // been flipped
  let t1 = t[i+3]
  if (isghost(t) || t1 == null || isghost(t1) ||
      t.indexOf(v0) === -1 ||
      t.indexOf(v1) === -1 ||
      t.indexOf(v2) === -1) {
    return
  }

  // Set i1 to the index of the vertex not shared by t1
  let i1 = t1.indexOf(t) - 3
  if (i1 < 0) {
    throw new Error('Bad triangulation')
  }

  // If the opposite vertex of the neighboring triangle is not in the
  // circumcircle of the current triangle, there is no need to flip and
  // we are done
  if (!inCircle(t, t1[i1])) {
    return
  }

  // Flip the shared edge
  flip(t, i)

  // Set ta = (t, i), tb = (t1, i1+1), tc = (t1, i1), and td = (t, i+1).
  let ta = t[i+3]
  let tb = t1[(i1+1)%3 + 3]
  let tc = t1[i1+3]
  let td = t[(i+1)%3 + 3]

  // Call flip_p4(ta, index(ta, t))
  // Call flip_p4(tb, index(tb, t1))
  // Call flip_p4(tc, index(tc, t1))
  // Call flip_p4(td, index(td, t))
  if (ta != null) {
    flipP4(ta, ta.indexOf(t) - 3, ta[0], ta[1], ta[2])
  }
  if (tb != null) {
    flipP4(tb, tb.indexOf(t1) - 3, tb[0], tb[1], tb[2])
  }
  if (tc != null) {
    flipP4(tc, tc.indexOf(t1) - 3, tc[0], tc[1], tc[2])
  }
  if (td != null) {
    flipP4(td, td.indexOf(t) - 3, td[0], td[1], td[2])
  }
}

export function isghost(t) {
  return t[2] == null
}

export function ccw(v) {
  debug('ccw', arguments)

  let t = v[2]
  let torig = t
  let tnext

  // If the vertex's triangle is already a ghost, we need to see if we
  // are on the correct side. If so, we return immediately.
  if (isghost(t) && t.indexOf(v) === 0) {
    return t
  }

  do {
    tnext = t[(t.indexOf(v)+1)%3 + 3]
    if (tnext == null) {
      return t
    }
    t = tnext
    if (t === torig) {
      return null
    }
  } while (!isghost(t))

  return t
}

// cw starts at the triangle referenced by v and iterates clockwise
// around the triangles which contain v until it finds a ghost triangle
export function cw(v) {
  debug('cw', arguments)

  let t = v[2]
  let torig = t
  let tnext

  // If the vertex's triangle is a ghost, we need to immediately check
  // if we are on the correct side. If so, we return.
  if (isghost(t) && t.indexOf(v) === 1) {
    return t
  }

  do {
    tnext = t[(t.indexOf(v)+2)%3 + 3]
    if (tnext == null) {
      return t
    }
    t = tnext
    if (t === torig) {
      return null
    }
  } while (!isghost(t))

  return t
}

// mateghost turns a ghost triangle (t) into a real triangle by linking
// it to vertex (v) and linking it with the triangle below it (tb)
export function mateghost(t, v, tb) {
  debug('mateghost', arguments)

  t[2] = v

  if (tb.indexOf(v) < 0) {
    throw new Error('Mating triangles that do not share vertices')
  }

  // Add t to the neighbors of tb and vice versa
  for (let i = 0; i < 3; i++) {
    if (tb.indexOf(t[i]) < 0) {
      t[i+3] = tb
    }
    if (t.indexOf(tb[i]) < 0) {
      tb[i+3] = t
    }
  }

  return t
}

export function circumradius(t) {

}

export function circumcenter(t) {
  let [ a, b, c ] = t
  let [ ax, ay ] = a
  let [ bx, by ] = b
  let [ cx, cy ] = c

  let d = 2*(ax*(by-cy) + bx*(cy-ay) + cx*(ay-by))
  let am = ax*ax+ay*ay
  let bm = bx*bx+by*by
  let cm = cx*cx+cy*cy
  let ux = (am*(by-cy) + bm*(cy-ay) + cm*(ay-by))/d
  let uy = (am*(cx-bx) + bm*(ax-cx) + cm*(bx-ax))/d

  return [ux, uy]
}

// inCircle returns true if v is in the circumcircle of t
export function inCircle(t, v) {
  let [ a, b, c ] = t
  let [ ax, ay ] = a
  let [ bx, by ] = b
  let [ cx, cy ] = c
  let [ vx, vy ] = v

  // algorithm from wikipedia
  let d = 2*(ax*(by-cy) + bx*(cy-ay) + cx*(ay-by))
  let am = ax*ax+ay*ay
  let bm = bx*bx+by*by
  let cm = cx*cx+cy*cy
  let ux = (am*(by-cy) + bm*(cy-ay) + cm*(ay-by))/d
  let uy = (am*(cx-bx) + bm*(ax-cx) + cm*(bx-ax))/d
  let ur = (ux-ax)*(ux-ax) + (uy-ay)*(uy-ay)
  let vr = (ux-vx)*(ux-vx) + (uy-vy)*(uy-vy)

  return ur > vr
}

// boundary returns the upper and lower convex boundary between two sets
// of vertices (ar[lp-lr] and ar[rp-rr])
export function boundary(ar, j, lp, lr, rp, rr) {
  debug('boundary', arguments)

  let e = j & 1

  // Let l be the rightmost point of lp-lr
  // Let r be the leftmost point of rp-rr
  // TODO: use the tree to find minimums
  let l, r
  if (lp < rp) {
    l = findMax(ar, 0, e, lp, lr)
    r = findMin(ar, 0, e, rp, rr)
  } else {
    l = findMin(ar, 0, e, lp, lr)
    r = findMax(ar, 0, e, rp, rr)
  }

  let v
  let tl = ccw(l)
  let tr = cw(r)
  let check = 0

  for (;;) {

    // move l clockwise until it is a tangent to the right side
    v = tl[1]
    while (cross(r, l, v) < 0) {
      l = v
      tl = tl[3]
      v = tl[1]
      check = 0
    }

    if (++check === 2) {
      return [l, r]
    }

    // move r counterclockwise until it is a tangent to the left side
    v = tr[0]
    while (cross(r, l, v) < 0) {
      r = v
      tr = tr[4]
      v = tr[0]
      check = 0
    }

    if (++check === 2) {
      return [l, r]
    }
  }
}

// findMax finds the vertex in ar on the interval [p, r] with the
// minimum coordinate in the e direction
function findMin(ar, j, e, p, r) {
  let i, pos, min, minPos = Infinity
  for (i = p; i <= r; i++) {
    pos = ar[i][e]
    if (pos <= minPos) {
      if (pos === minPos && ar[i][1-e] < min[1-e]) {
        continue
      }
      minPos = pos
      min = ar[i]
    }
  }

  return min
}

// findMax finds the vertex in ar on the interval [p, r] with the
// maximum coordinate in the e direction
function findMax(ar, j, e, p, r) {
  let i, pos, max, maxPos = -Infinity
  for (i = p; i <= r; i++) {
    pos = ar[i][e]
    if (pos >= maxPos) {
      if (pos === maxPos && ar[i][1-e] < max[1-e]) {
        continue
      }
      maxPos = pos
      max = ar[i]
    }
  }

  return max
}

// cross computes (v0-vs)x(v1-vs)
export function cross(v0, vs, v1) {
  let ux = v0[0] - vs[0]
  let uy = v0[1] - vs[1]
  let vx = v1[0] - vs[0]
  let vy = v1[1] - vs[1]
  return ux*vy - uy*vx
}

// angle returns the angle between vectors (v0-vs) and (v1-vs) from
// between 0 and 2π. Angles where the cross product would be negative
// are mapped to [π, 2π)
export function angle(v0, vs, v1) {
  let ux = v0[0] - vs[0]
  let uy = v0[1] - vs[1]
  let vx = v1[0] - vs[0]
  let vy = v1[1] - vs[1]
  let xp = ux*vy - uy*vx
  let dot = ux*vx + uy*vy

  if (xp === 0) {
    return dot > 0 ? 0 : π
  }

  let ang = Math.acos(dot / (Math.sqrt(ux*ux+uy*uy) * Math.sqrt(vx*vx+vy*vy)))

  return xp > 0 ? ang : 2*π - ang
}
