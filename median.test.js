import * as med from './median'
import mocha from 'mocha'
import assert from 'assert'

var tests = {}

tests.partition = {
  ins: [
    [ [4,1,3,2,5,8,9], 0, 0, 6 ],
    [ [1,4], 0, 0, 1 ],
    [ [8,3,1,5,3,7,2,9,7,5,6,3,2,1,5,7], 0, 0, 15 ],
    [ [8,3,1,5,3,7,2,9,7,5,6,3,2,1,5,1], 0, 8, 15 ]
  ]
}

describe.skip('partition', function () {
  it('should partition an array about its median', function () {
    var cases = tests.partition
    cases.ins.forEach(function (test, i) {
      var verts = test[0].map(function (p) { return {p: [p, 0]} })
      med.partition(verts, test[1], test[2], test[3])
      var median = verts[verts.length >> 1].p[0]
      verts = verts.slice(test[2], test[3] + 1)
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

describe('slowPartition', function () {
  it('should partition an array about its median', function () {
    var cases = tests.partition
    cases.ins.forEach(function (test, i) {
      var verts = test[0].map(function (p) { return {p: [p, 0]} })
      med.slowPartition(verts, test[1], test[2], test[3])
      var median = verts[verts.length >> 1].p[0]
      verts = verts.slice(test[2], test[3] + 1)
      verts.forEach(function (v, i) {
        if (i === verts.length >> 1) {
          return
        }
        var c = v.p[0]
        console.log(c, i)
        if (i < verts.length >> 1) {
          c <= median || assert.fail(c, median, null, '<=')
        } else {
          c >= median || assert.fail(c, median, null, '>=')
        }
      })
    })
  })
})