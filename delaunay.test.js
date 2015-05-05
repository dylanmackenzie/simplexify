import * as del from './delaunay'
import mocha from 'mocha'
import assert from 'assert'

var verts = [
  [5,9],[1,8],[2.8,5.4],[4,1],[7.5,4],[3,7],[6,3],[7,2],[9,6]
].map(function (p) { return {p: p} })

var sorted = [
  [4,1],[2.8,5.4],[1,8],[3,7],[5,9],[7,2],[6,3],[7.5,4],[9,6]
].map(function (p) { return {p: p} })

var tests = {}

tests.sort2d = {
  ins: [
    [verts.slice(0), 0]
  ],
  outs: [
    [3,2,1,5,0,7,6,4,8]
  ]
}

tests.boundary = {
  ins: [
    [ sorted, 1, 0, 2, 3, 4],
    [ sorted, 1, 5, 6, 7, 8],
    [ sorted, 0, 0, 4, 5, 8]
  ],
  outs: [
    [ 2, 4, 0, 4 ],
    [ 6, 8, 5, 8 ],
    [ 0, 5, 4, 8 ]
  ]
}

tests.angle = {
  ins: [
    [2, 3, 1], // 2,3,1
    [3, 2, 4]  // 3,2,4
  ],
  outs: [
    2,
    3
  ]
}

describe('sort2d', function () {
  it('should sort an unordered array of vertices into a 2d tree', function () {
    var cases = tests.sort2d
    cases.ins.forEach(function (test, i) {
      var verts = test[0]
      var unsorted = verts.slice(0)
      del.sort2d(verts, test[1], 0, verts.length - 1)
      var actual = verts.map(function (v) {
        return unsorted.indexOf(v)
      })
      assert.deepEqual(actual, cases.outs[i])
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
    let t1 = {}, t2 = {}, t3 = {}, t4 = {}, t5 = {}, t6 = {}
    let v1 = {t: t1}, v2 = {t: t1}, v3 = {t: t1}, v4 = {t: t2}
    let tris = [null, t1, t2, t3, t4, t5, t6]
    let verts = [null, v1, v2, v3, v4]
    t1.v = [v1, v2, v3]
    t1.n = [t6, t2, t5]
    t2.v = [v1, v3, v4]
    t2.n = [t4, t3, t1]
    t3.v = [v1, v4, null]
    t3.n = [null, null, t2]
    t4.v = [v4, v3, null]
    t4.n = [null, null, t2]
    t5.v = [v2, v1, null]
    t5.n = [null, null, t1]
    t6.v = [v3, v2, null]
    t6.n = [null, null, t1]

    function vertIndex(v) {
      return verts.indexOf(v)
    }
    function triIndex(t) {
      return tris.indexOf(t)
    }

    del.flip(t1, 1)
    if (!(t1.v.indexOf(v1) >= 0 &&
          t1.v.indexOf(v2) >= 0 &&
          t1.v.indexOf(v4) >= 0)) {
      assert.fail(t1.v.map(vertIndex), [1, 2, 4], null, '==')
    }
    if (!(t2.v.indexOf(v2) >= 0 &&
          t2.v.indexOf(v3) >= 0 &&
          t2.v.indexOf(v4) >= 0)) {
      assert.fail(t2.v.map(vertIndex), [2, 3, 4], null, '==')
    }
    let t1v1 = t1.n[t1.v.indexOf(v1)]
    assert.equal(t1v1, t2, 't1.n[v1] !== t2 instead got t'+triIndex(t1v1))
    let t1v2 = t1.n[t1.v.indexOf(v2)]
    assert.equal(t1v2, t3, 't1.n[v2] !== t3 instead got t'+triIndex(t1v2))
    let t1v4 = t1.n[t1.v.indexOf(v4)]
    assert.equal(t1v4, t5, 't1.n[v4] !== t5 instead got t'+triIndex(t1v4))
    let t2v3 = t2.n[t2.v.indexOf(v3)]
    assert.equal(t2v3, t1, 't2.n[v3] !== t1 instead got t'+triIndex(t2v3))
    let t2v2 = t2.n[t2.v.indexOf(v2)]
    assert.equal(t2v2, t4, 't2.n[v2] !== t4 instead got t'+triIndex(t2v2))
    let t2v4 = t2.n[t2.v.indexOf(v4)]
    assert.equal(t2v4, t6, 't2.n[v4] !== t6 instead got t'+triIndex(t2v4))

    assert.equal(t3.n[2], t1, 't3 should neighbor t1')
    assert.equal(t5.n[2], t1, 't5 should neighbor t1')
    assert.equal(t4.n[2], t2, 't4 should neighbor t2')
    assert.equal(t6.n[2], t2, 't6 should neighbor t2')
  })
})

describe('angle', function () {
  it('should calculate the angle between three vertices', function () {
    var cases = tests.angle
    var verts = cases.ins[0].map(function (p) { return {p: p} })
    var angle = del.angle.apply(null, verts)
    if (angle > Math.PI) {
      assert.fail(angle, Math.PI, '', '<')
    }
  })
  it('should return angles over 180 degrees', function () {
    var cases = tests.angle
    var verts = cases.ins[1].map(function (p) { return {p: p} })
    var angle = del.angle.apply(null, verts)
    if (angle < Math.PI) {
      assert.fail(angle, Math.PI, '', '>')
    }
  })
})

describe('flip', function () {

})

describe('inCircle', function () {

})

describe('delaunay', function () {

})
