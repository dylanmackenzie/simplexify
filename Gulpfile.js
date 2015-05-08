var gulp = require('gulp')
var babel = require('gulp-babel')
var browserify = require('browserify')
var connect = require('gulp-connect')
var source = require('vinyl-source-stream')

gulp.task('compile', function () {
  return gulp.src(['*.js', 'test/*.test.js', 'test/reporter.js', '!Gulpfile.js'])
    .pipe(babel())
    .pipe(gulp.dest('es5/'))
})

gulp.task('builddemo', ['compile'], function () {
  return browserify({
      basedir: 'es5/',
      entries: './demo.js'
    }).bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('es5/'))
})

gulp.task('buildtest', ['compile'], function () {
  return browserify({
      basedir: 'es5/',
      entries: ['./median.test.js', './delaunay.test.js']
    }).bundle()
    .pipe(source('test.js'))
    .pipe(gulp.dest('es5/'))
})

gulp.task('server', function () {
  connect.server({
    port: 8888
  })
})

gulp.task('demo', ['builddemo', 'server'], function () {
  gulp.watch(['*.js', '!Gulpfile.js'], ['builddemo'])
})

gulp.task('test', ['buildtest', 'server'], function () {
  gulp.watch(['*.js', 'test/*.test.js', '!Gulpfile.js'], ['buildtest'])
})

gulp.task('default', ['test'])
