import Benchmark from 'benchmark'
import sr from 'seedrandom'
import { slowPartition, partition } from './median'
import Delaunay from './delaunay'

const BENCH_LEN = 8

let rng = new Math.seedrandom(42)
let suites = {
  delaunay: new Benchmark.Suite('delaunay'),
  partition: new Benchmark.Suite('partition'),
  slowPartition: new Benchmark.Suite('slowPartition')
}

let benches = []
for (let i = 1; i < BENCH_LEN; i++) {
  let bench = []
  for (let j = 0; j < Math.pow(2, i); j++) {
    bench.push({ p: [rng(), rng()], t: null })
  }
  benches.push(bench)
}

benches.forEach(function(ar, i) {
  suites.slowPartition.add('slowPartition\t'+i, function() {
    slowPartition(Benchmark.deepClone(ar), 0, 0, ar.length-1)
  })

  suites.partition.add('partition\t'+i, function() {
    partition(Benchmark.deepClone(ar), 0, 0, ar.length-1)
  })

  suites.delaunay.add('delaunay\t'+i, function () {
    let del = new Delaunay([])
    del.verts = Benchmark.deepClone(ar)
    del.delaunay()
  })
})

for (let name in suites) {
  if (name !== 'delaunay') {
    continue
  }

  suites[name].on('cycle', (e) => {
    let index = e.target.name.split('\t')[1]
    console.log(benches[index].length + '\t' + e.target.stats.mean)
  })

  suites[name].on('error', (e) => {
    console.log(e.error)
  })

  suites[name].on('start', (suite) => {
    console.log(suite.currentTarget.name + '\n')
  })
  suites[name].run()
}

