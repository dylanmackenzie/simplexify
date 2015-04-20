var gulp = require('gulp');
var mocha = require('gulp-mocha');
var babel = require('gulp-babel');

gulp.task('compile', function () {
  return gulp.src('*.js')
    .pipe(babel())
    .pipe(gulp.dest('es5/'))
})

gulp.task('test', ['compile'], function () {
  return gulp.src('es5/delaunay.test.js', {read: false})
    .pipe(mocha())
})

gulp.task('default', ['test'])
