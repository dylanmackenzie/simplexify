/* eslint-env mocha */

import Delaunay, * as del from './delaunay'
import View from './view.js'
import assert from 'assert'

let tests = {}

function verify2dTree(ar, j, p, r) {
  if (r === p) {
    return true
  }

  let e = j & 1
  let q = (p + r)>> 1
  let mid = ar[q][e]

  for (let i = p; i < q; i++) {
    if (ar[i][e] > mid) {
      return false
    }
  }
  for (let i = q + 1; i <= r; i++) {
    if (ar[i][e] < mid) {
      return false
    }
  }

  return (verify2dTree(ar, j+1, p, q) &&
          verify2dTree(ar, j+1, q+1, r))
}

tests.sort2d = [
  {
    it: 'sorts an unordered array of vertices into a 2d tree',
    points: [
      [5, 9], [1, 8], [2.8, 5.4], [4, 1], [7.5, 4],
      [3, 7], [6, 3], [7, 2], [9, 6]
    ]
  }
]

describe('sort2d', function () {
  it('should sort an unordered array of vertices into a 2d tree', function () {
    let cases = tests.sort2d
    cases.forEach(function (test) {
      let verts = test.points
      it(test.it, function () {
        del.sort2d(verts, 0, 0, verts.length - 1)
        assert.ok(verify2dTree, '2d tree not in correct order')
      })
    })
  })
})

//        1                     1
//        *                     *
//   t5 / |\ t3            t5 /  \ t3
//    /   | \      --->     /  t1 \
// 2 *_ t1|t2* 4         2 *_------* 4
//     --_\ /  t4            --_t2/   t4
//   t6   -* 3             t6   -* 3
//
describe('flip', function () {
  it('should flip an edge shared between two triangles', function () {
    let t1 = [], t2 = []
    let v1 = [0, 1, t1], v2 = [-1, 0, t1]
    let v3 = [0, -1, t1], v4 = [1, 0, t2]
    t1.splice(0, 0, v1, v2, v3)
    t2.splice(0, 0, v1, v3, v4)
    let t3 = [v1, v4, null, null, null, t2]
    let t4 = [v4, v3, null, null, null, t2]
    let t5 = [v2, v1, null, null, null, t1]
    let t6 = [v3, v2, null, null, null, t1]
    t1.splice(3, 0, t6, t2, t5)
    t2.splice(3, 0, t4, t3, t1)
    let tris = [null, t1, t2, t3, t4, t5, t6]
    let verts = [null, v1, v2, v3, v4]

    function vertIndex(v) {
      return verts.indexOf(v)
    }
    function triIndex(t) {
      return tris.indexOf(t)
    }

    del.flip(t1, 1)
    if (!(t1.indexOf(v1) >= 0 &&
          t1.indexOf(v2) >= 0 &&
          t1.indexOf(v4) >= 0)) {
      assert.fail(t1.map(vertIndex), [1, 2, 4], null, '==')
    }
    if (!(t2.indexOf(v2) >= 0 &&
          t2.indexOf(v3) >= 0 &&
          t2.indexOf(v4) >= 0)) {
      assert.fail(t2.map(vertIndex), [2, 3, 4], null, '==')
    }
    let t1v1 = t1[t1.indexOf(v1) + 3]
    assert.equal(t1v1, t2, 't1.n[v1] !== t2 instead got t'+triIndex(t1v1))
    let t1v2 = t1[t1.indexOf(v2) + 3]
    assert.equal(t1v2, t3, 't1.n[v2] !== t3 instead got t'+triIndex(t1v2))
    let t1v4 = t1[t1.indexOf(v4) + 3]
    assert.equal(t1v4, t5, 't1.n[v4] !== t5 instead got t'+triIndex(t1v4))
    let t2v3 = t2[t2.indexOf(v3) + 3]
    assert.equal(t2v3, t1, 't2.n[v3] !== t1 instead got t'+triIndex(t2v3))
    let t2v2 = t2[t2.indexOf(v2) + 3]
    assert.equal(t2v2, t4, 't2.n[v2] !== t4 instead got t'+triIndex(t2v2))
    let t2v4 = t2[t2.indexOf(v4) + 3]
    assert.equal(t2v4, t6, 't2.n[v4] !== t6 instead got t'+triIndex(t2v4))

    assert.equal(t3[5], t1, 't3 should neighbor t1')
    assert.equal(t5[5], t1, 't5 should neighbor t1')
    assert.equal(t4[5], t2, 't4 should neighbor t2')
    assert.equal(t6[5], t2, 't6 should neighbor t2')
  })
})

tests.angle = [
  {
    it: 'calculates the angle between three vertices',
    points: [ [1, 0], [0, 0], [Math.sqrt(2), Math.sqrt(2)] ],
    out: Math.PI / 4
  },
  {
    it: 'handles angles greater than 180 degrees',
    points: [ [0, 1], [0, 0], [1, 0] ],
    out: 3*Math.PI / 2
  }
]

describe('angle', function () {
  let cases = tests.angle
  cases.forEach(test => {
    let verts = test.points
    it(test.it, function () {
      assert.equal(del.angle.apply(null, verts), test.out)
    })
  })
})

function verifyDelaunay(tri) {
  return !tri.tris.some(t => {
    if (t[2] == null) {
      return false
    }

    return tri.verts.some(v => t.indexOf(v) < 0 ? del.inCircle(t, v) : false)
  })
}

tests.boundary = [
  {
    it: 'finds the upper and lower convex boundary of two regions',
    points: []
  },
  {
    it: 'handles collinear vertices',
    points: []
  }
]

describe('boundary', function () {

})

function checkNeighbors(tri) {
  tri.tris.forEach(function (t) {
    if (t[2] == null) {
      return
    }
    t.slice(3, 6).forEach(function (ne) {
      if (ne == null) {
        return
      }
      let count = 0
      t.slice(0, 3).forEach(function (v) {
        if (ne.indexOf(v) < 0) {
          count++
        }
      })

      assert.ok(count === 1, 'Improper neighbors: ' + tri.tri(t))
    })
  })
}

tests.delaunay = [
  {
    it: 'creates a delaunay triangulation on a set of vertices',
    points: [
      [5, 9], [1, 8], [2.8, 5.4], [4, 1], [7.5, 4],
      [3, 7], [6, 3], [7, 2], [9, 6]
    ],
    viewport: [0, 0, 10, 10]
  },
  {
    it: 'handles collinear vertices',
    points: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 5], [2, 5], [3, 5], [4, 5], [5, 5]
    ],
    viewport: [-1, -1, 7, 7]
  }
]

describe('delaunay', function () {
  // Set timeout to 0 in case we want to debug
  this.timeout(0)

  let cases = tests.delaunay
  cases.forEach(function (test) {
    it(test.it, function () {
      let verts = test.points.map(p => ({ x: p[0], y: p[1] }))
      let tri = new Delaunay(verts)
      if (this.canvas) {
        window.curView = new View(this.canvas, tri, test.viewport)
        this.canvas.scrollIntoView()
      }
      tri.delaunay()
      assert.ok(verifyDelaunay(tri), 'Triangulation not delaunay')
      checkNeighbors(tri)
    })
  })
})
