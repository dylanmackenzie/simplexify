import * as del from './delaunay'
import mocha from 'mocha'
import assert from 'assert'

var tests = {}

tests.insertionSort = {
  ins: [
    [ [4,8,1,2,4], 0, 5 ],
    [ [6,4,3,1,2], 0, 3 ]
  ],
  outs: [
    [1,2,4,4,8],
    [3,4,6,1,2]
  ]
}

tests.median = {
  ins: [
    [4,8,1,2,4],
    [6,4,3,1,2],
    [1,2,4,5,8,3,6,7,9]
  ],
  outs: [
    4,
    3,
    5
  ]
}

tests.sort2d = {
  ins: [
    [ [5,1],[1,2],[2,6],[4,9],[8,5],[3,3],[6,7],[7,8],[9,4] ]
  ],
  outs: [
    [3,2,1,5,0,7,6,4,8]
  ]
}

describe('insertionSort', function () {
  it('sorts arrays in place', function () {
    var cases = tests.insertionSort
    cases.ins.forEach(function (test, i) {
      var ar = del.insertionSort.apply(null, test)
      assert.deepEqual(ar, cases.outs[i])
    })
  })
})

describe('median', function () {
  it('finds the median of an array', function () {
    var cases = tests.median
    cases.ins.forEach(function (test, i) {
      var med = del.median(test)
      assert.equal(med, cases.outs[i])
    })
  })
})

describe('sort2d', function () {
  it('should sort an unordered array of vertices into a 2d tree', function () {
    var cases = tests.sort2d
    cases.ins.forEach(function (test, i) {
      var verts = test.map(function (p) { return {p: p} })
      var copy = verts.slice(0)
      del.sort2d(verts, 0, 0, verts.length - 1)
      var expected = cases.outs[i].map(function (_, i) {
        return copy[i]
      })
      assert.deepEqual(verts, expected)
    })
  })
})
