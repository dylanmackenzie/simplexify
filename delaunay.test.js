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
    [verts.slice(0), 1]
  ],
  outs: [
    [3,2,1,5,0,7,6,4,8]
  ]
}

tests.boundaries = {
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

tests.boundAngle = {
  ins: [
  ],
  outs: [
  ]
}

describe('sort2d', function () {
  it('should sort an unordered array of vertices into a 2d tree', function () {
    var cases = tests.sort2d
    cases.ins.forEach(function (test, i) {
      var verts = test[0]
      var unsorted = verts.slice(0)
      del.sort2d(verts, 0, 0, verts.length - 1)
      var actual = verts.map(function (v) {
        return unsorted.indexOf(v)
      })
      assert.deepEqual(actual, cases.outs[i])
    })
  })
})

describe('boundary', function () {
  it('find lowest and highest convex boundary of vertices in a kd-tree', function () {
    // test 1 is the depth
    var cases = tests.boundaries
    cases.ins.forEach(function (test, i) {
      debugger
      var actual = del.boundaries.apply(null, test)
      actual = actual.map(function (v) {
        return sorted.indexOf(v)
      })
      assert.deepEqual(actual, cases.outs[i])
    })
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

desc('inCircle', function () {

})
