/* jshint esnext: true */

// DelaunaySolver computes the Delaunay triangulation for a given set of
// points. It accepts an array of objects which have both an x and a y
// property whose values are numbers
//
// verts is an array of objects with an array containing the x and y
// coordinates (p) and a pointer to a triangle (t) in the corresponding
// tris array which contains this vertex
//
// tris is an array of objects containing two sub-arrays:
// v contains three pointers representing the vertices
// of the triangle in counter-clockwise order.
// n contains pointers to the triangles which share edges with this one.
// Neighbors are ordered such that n[0] shares the edge opposite to
// v[0]
//
// tree is a flattened 2d tree used for efficiently selecting which
// groups to merge
export default function DelaunaySolver(points) {

  var verts = this.verts = new Array(points.length)
  points.forEach(function (p, i) {
    verts[i] = { p: [p.x, p.y], t: null }
  })

  var tris = this.tris = []
  tris = tris
}

// initTree takes an array of unsorted vertices and arranges them
// in-place into a flattened 2d-tree. It is a wrapper for the recursive
// function `sort2d`
DelaunaySolver.prototype.initTree = function () {

}

// sort2d is called recursively to sort an array of vertices into a
// 2d-tree. j is the current depth, and p and r are the start and end
// indexes respectively
export function sort2d(ar, j, p, r) {
  if (p >= r) {
    return
  }

  // q is the index of the midpoint of the array
  var q = ((p+r) >> 1) + p

  // if the current depth is even, use the x coordinate as the
  // discriminator, else use the y coordinate
  var e = j & 1

  // coords is an array containing only the discriminator
  // we use it for sorting
  var coords = ar.slice(p, r+1).map(function (v) {
    return v.p[e]
  })


  // m is the index of the median element in ar
  var m = coords.indexOf(median(coords)) + p
  console.log(coords, median(coords), m);

  // swap median and midpoint
  var med = ar[m]
  ar[m] = ar[q]
  ar[q] = med

  // partition elements on either side of the median
  // TODO: do an in place partition
  var lt = []
  var gt = []
  var eq = []
  var cmp = med.p[e]
  var cur
  for (var i = p; i <= r; i++) {
    cur = ar[i]
    if (cur.p[e] < cmp) {
      lt.push(cur)
    } else if (cur.p[e] < cmp) {
      gt.push(cur)
    } else /* equal to median */ {
      eq.push(cur)
    }
  }

  var sorted = lt.concat(eq, gt)
  for (i = p; i <= r; i++) {
    ar[i] = sorted[i]
  }

  console.log(ar, m, p, r)
  console.log()

  // recursively partition using the other coordinate
  sort2d(ar, j+1, p, q-1)
  sort2d(ar, j+1, q+1, r)
}

// median implements the median of medians algorithm recursively. It
// uses an insertion sort to sort the small arrays due to its low
// overhead.
export function median(ar) {
  var len = ar.length

  if (len <= 5) {
    insertionSort(ar, 0, ar.length)
    return ar[len >> 1]
  }

  // lim cause the loop to skip the last elements if they are not
  // divisible y 5
  var lim = len - 5
  var medians = []
  for (var i = 0; i <= lim; i += 5) {
    insertionSort(ar, i, i+5)
    medians.push(ar[i + 2])
    console.log(ar.slice(i, i+5));
    console.log(medians);
  }


  // Sort leftover elements if we have them
  if (i != len) {
    insertionSort(ar, i, len)
    medians.push(ar[i + ((len-i-1) >> 1)])
    console.log(ar.slice(i, len));
    console.log(medians);
  }

  return median(medians)
}

// sorts ar from p to r (exlcuding r)
export function insertionSort(ar, p, r) {
  var tmp
  for (var i = p+1; i < r; i++) {
    for (var j = i; j > p && ar[j-1] > ar[j]; --j)  {
      tmp = ar[j]
      ar[j] = ar[j-1]
      ar[j-1] = tmp
    }
  }

  return ar
}

// flip performs an edge flip between triangle t and t.n[i] (the ith
// neighbor of t)
DelaunaySolver.prototype.flip = function (t, i) {
  var tmp

  // u is the neighbor to be flipped with
  var u = t.n[i]

  // j is the position of t in neighbors of u
  var j = u.n.indexOf(t)

  // cache index math
  var i1 = i+1%3
  var i2 = i+2%3
  var j1 = j+1%3
  var j2 = j+2%3

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
  tmp = t.n[i2]
  t.n[i2] = u.n[j2]
  u.n[j2] = tmp

  // swap neighbor position of other triangle in flip
  u.n[j2] = t
  t.n[i2] = u
}



export function split(vertices) {
  var splits = [vertices.length]
  var tmp, v

  while (true) {
    tmp = []
    for (var i = 0, len = splits.length; i < len; i++) {
      v = splits[i]
      if (v & 1) { // if v is odd
        tmp.push((v >> 1) + 1)
        tmp.push(v >> 1)
      } else {
        tmp.push(v >> 1)
        tmp.push(v >> 1)
      }
    }
    splits = tmp

    // splitting algorithm ensures the largest split is at the beginning
    // if it is less than or equal to 3, then so is everything else
    if (splits[0] <= 3) {
      break
    }
  }

  return splits

}

// baseEdge finds the lowest LR edge
// a and b are arrays containing vertices in 2d space
export function baseEdge(l, r) {
  // find lowest y coord
  var low = l[0]
  var lowy = low.y
  var isRight = false

  for (var i = 1, len = l.length; i < len; i++) {
    if (l[i].y < lowy) {
      low = l[i]
      lowy = low.y
    } else if (l[i].y === lowy) {
      if (l[i].x > low.x) {
        low = l[i]
      }
    }
  }
  for (i = 0, len = r.length; i < len; i++) {
    if (r[i].y < lowy) {
      low = r[i]
      lowy = low.y
      isRight = true
    } else if (r[i].y === lowy) {
      if (r[i].x < low.x) {
        low = r[i]
        isRight = true
      }
    }
  }

  // find vertex from other group with lowest angle from x axis
  var other = isRight ? r : l
  var rmul = isRight ? -1 : 1
  var lowx = low.x
  var min = 90
  var angle, second
  for (i = 0, len = other.length; i < len; i++) {
    angle = Math.atan(rmul * (other[i].y - lowy) / (other[i].x - lowx))
    if (angle < min) {
      min = angle
      second = other[i]
    }
  }

  return [ low, second ]

}

// Merge two groups of triangles
export function merge() {

}

var Triangle = null

export function initTriangles(vertices) {
  // initialize triangles/ghost triangles for set of vertices

  var ts, t1, t2, t3, t4

  if (split === 2) {
    ts = new Array(2)
    t1 = ts[0]= new Triangle(vertices)
    t2 = ts[1]= new Triangle(vertices)
    t1.adj[0] = t1.adj[1] = t1.adj[2] = t2
    t2.adj[0] = t2.adj[1] = t2.adj[2] = t1
  } else /* split === 3 */ {
    ts = new Array(4)
    t1 = ts[0]= new Triangle(vertices)
    t2 = ts[1]= new Triangle(vertices)
    t3 = ts[2]= new Triangle(vertices)
    t4 = ts[3]= new Triangle(vertices)
    t1.adjs[0] = t2
    t1.adjs[1] = t3
    t1.adjs[2] = t4
    t2.verts[0] = t3.verts[1] = t4.verts[2] = null
    t2.adj[0] = t3.adj[1] = t4.adj[2] = t1
    t3.adj[0] = t4.adj[0] = t2
    t2.adj[1] = t4.adj[1] = t3
    t2.adj[2] = t3.adj[2] = t4
  }

  return ts
}
