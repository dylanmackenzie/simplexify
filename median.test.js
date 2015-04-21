import * as med from './median'
import mocha from 'mocha'
import assert from 'assert'

var tests = {}

tests.median = {
  ins: [
    [4,1,3,2,5],
    [4, 1]
  ],
  outs: [
    3,
    1
  ]
}

tests.partition = {
  ins: [
    [4,1,3,2,5,8,9],
    [1,4],
  ]
}

describe('partition', function () {
  it('should partition an array about its median', function () {
    var cases = tests.partition
    cases.ins.forEach(function (test, i) {
      var verts = test.map(function (p) { return {p: [p, 0]} })
      med.partition(verts, 0, 0, verts.length - 1)
      var median = verts[verts.length >> 1].p[0]
      verts.forEach(function (v, i) {
        if (i === verts.length >> 1) {
          return
        }
        var c = v.p[0]
        if (i < verts.length >> 1) {
          c <= median || assert.fail(c, median, null, '<=')
        } else {
          c >= median || assert.fail(c, median, null, '>=')
        }
      })
    })
  })
})

describe('median', function () {
  it('should find the median of a subset of a give array', function () {
    var cases = tests.median
    cases.ins.forEach(function (test, i) {
      var verts = test.map(function (p) { return {p: [p, 0]} })
      var m = med.median(verts, 0, 0, verts.length - 1)
      assert.equal(test[m], cases.outs[i])
    })
  })
})
