import Benchmark from 'benchmark'
import sr from 'seedrandom'
import { slowPartition, partition } from './median'
import Delaunay from './delaunay'

const BENCH_LEN = 100

let rng = new Math.seedrandom(42)
let suite = new Benchmark.Suite()

let benches = []
for (let i = 0; i < BENCH_LEN; i++) {
  let bench = []
  for (let j = 0; j < i*71 + 4; j++) {
    bench.push({ p: [rng(), rng()], t: null })
  }
  benches.push(bench)
}

function doBench(ar) {
  let ar1 = Benchmark.deepClone(ar)
  let ar2 = Benchmark.deepClone(ar)
  let ar3 = Benchmark.deepClone(ar)

  // suite.add('slowPartition', function() {
    // slowPartition(ar1, 0, 0, ar1.length-1)
  // })

  // suite.add('partition', function() {
    // partition(ar2, 0, 0, ar2.length-1)
  // })

  suite.add('delaunay', function () {
    let del = new Delaunay([])
    del.verts = ar3
    del.delaunay()
  })
}

benches.forEach(doBench)

suite.on('cycle', (e) => {
  console.log(benches[e.target.id-1].length + '\t' + e.target.stats.mean)
})

suite.on('error', (err) => {
  console.log(err)
})

suite.run()
