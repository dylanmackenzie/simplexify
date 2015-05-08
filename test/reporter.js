import HTML from 'reporters/html.js'
import View from './view.js'

window.DelaunayReporter = DelaunayReporter

export default DelaunayReporter

class DelaunayReporter extends HTML {
  constructor(runner) {
    super(runner)
    runner.on('test end', (test) => {
      console.log('hello')
    })
  }
}
