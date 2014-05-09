var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    ngmin = require('gulp-ngmin'),
    livereload = require('gulp-livereload');

gulp.task('scripts', function() {
  return gulp.src(['src/angular-mapbox.js', 'src/**/*.js'])
    .pipe(concat('angular-mapbox.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', function() {
  return gulp.src(['src/angular-mapbox.js', 'src/**/*.js'])
    .pipe(concat('angular-mapbox.min.js'))
    .pipe(ngmin())
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], function() {
  var server = livereload();
  gulp.watch('src/**/*.js', ['scripts']);
  gulp.watch('dist/**').on('change', function(file) {
    server.changed(file.path);
  });
});

