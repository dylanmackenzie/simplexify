import Benchmark from 'benchmark'
import sr from 'seedrandom'
import { slowPartition, partition } from './median'
import Delaunay from './delaunay'

const BENCH_LEN = 16
global.Delaunay = Delaunay

Math.seedrandom(42)

console.log('Vertices' + '\t\t' + 'Average Time')
for (let i = 3; i < BENCH_LEN; ++i) {
  new Benchmark('delaunay'+i, {
    'setup': function () {
      let ar = []

      for (let j = 0; j < Math.pow(2, this.options.count); j++) {
        ar.push({x: Math.random(), y: Math.random()})
      }
    },
    'fn': function () {
      let del = new global.Delaunay(ar)
      del.delaunay()
    },
    'onComplete': function (e) {
      console.log(Math.pow(2, this.options.count) + '\t\t' + e.target.stats.mean)
    },
    'onError': function(e) {
      console.log(e.target.error)
    },
    'count': i
  }).run()
}
