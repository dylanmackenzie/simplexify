var gulp = require('gulp')
var mocha = require('gulp-mocha')
var babel = require('gulp-babel')
var browserify = require('browserify')
var connect = require('gulp-connect')
var source = require('vinyl-source-stream')

gulp.task('compile', function () {
  return gulp.src('*.js')
    .pipe(babel())
    .pipe(gulp.dest('es5/'))
})

gulp.task('browserify', ['compile'], function () {
  return browserify({
      basedir: 'es5/',
      entries: './debug.js'
    }).bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('es5/'))
})

gulp.task('test', ['compile'], function () {
  var spawn = require('child_process').spawn
  spawn('mocha', ['es5/delaunay.test.js', 'es5/median.test.js'].concat(process.argv.slice(3)), {stdio: 'inherit'})
})

gulp.task('debug', ['compile'], function () {
  var spawn = require('child_process').spawn
  spawn('mocha', ['--debug-brk', 'es5/delaunay.test.js', 'es5/median.test.js'].concat(process.argv.slice(3)), {stdio: 'inherit'})
})

gulp.task('browser', ['browserify'], function () {
  connect.server({
    port: 8888
  })
})

gulp.task('watch', function () {
  gulp.watch('*.js', ['browserify'])
})

gulp.task('default', ['browser', 'watch'])
