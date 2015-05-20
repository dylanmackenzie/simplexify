var gulp = require('gulp')
var babel = require('gulp-babel')
var browserify = require('browserify')
var connect = require('gulp-connect')
var changed = require('gulp-changed')
var source = require('vinyl-source-stream')
var spawn = require('child_process').spawn

gulp.task('compile', function () {
  return gulp.src(['benchmark/*.js', '*.js', 'test/*.test.js', 'test/reporter.js', '!Gulpfile.js'])
    .pipe(changed('dist/'))
    .pipe(babel())
    .pipe(gulp.dest('dist/'))
})

gulp.task('build:demo', ['compile'], function () {
  return browserify({
      basedir: 'dist/',
      entries: './demo.js'
    }).bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('dist/'))
})

gulp.task('build:test', ['compile'], function () {
  return browserify({
      basedir: 'dist/',
      entries: ['./median.test.js', './delaunay.test.js']
    }).bundle()
    .pipe(source('test.js'))
    .pipe(gulp.dest('dist/'))
})

gulp.task('build', ['compile'], function () {
  return browserify({
      basedir: 'dist/',
      entries: './index.js',
      standalone: 'simplexify'

    }).bundle()
    .pipe(source('simplexify.js'))
    .pipe(gulp.dest('dist/'))
})

gulp.task('benchmark', ['compile'], function () {
  var bench = spawn('node',  ['dist/benchmark.js'])
  bench.stdout.pipe(process.stdout)
  return new Promise(function (resolve, reject) {
    bench.on('close', function () {
      resolve()
    })
  })
})

gulp.task('server', function () {
  connect.server({
    port: 8888
  })
})

gulp.task('demo', ['build:demo', 'server'], function () {
  gulp.watch(['*.js', '!Gulpfile.js'], ['build:demo'])
})

gulp.task('test', ['build:test', 'server'], function () {
  gulp.watch(['*.js', 'test/*.test.js', '!Gulpfile.js'], ['build:test'])
})

gulp.task('default', ['test'])
