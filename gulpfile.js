var gulp       = require('gulp'),
    concat     = require('gulp-concat'),
    uglify     = require('gulp-uglify'),
    ngmin      = require('gulp-ngmin'),
    jshint     = require('gulp-jshint'),
    concatCss = require('gulp-concat-css'),
    livereload = require('gulp-livereload');

gulp.task('scripts', function() {
  return gulp.src(['src/angular-mapbox.js', 'src/**/*.js'])
    .pipe(concat('angular-mapbox.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build-modular', function() {
  return gulp.src(['src/angular-mapbox.js', 'src/**/*.js'])
    .pipe(concat('angular-mapbox.min.js'))
    .pipe(ngmin())
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build-standalone-scripts', function() {
  return gulp.src(['lib/mapbox.js',
                   'lib/**/*.js',
                   'src/angular-mapbox.js',
                   'src/services/**/*.js',
                   'src/directives/**/*.js',
                   'src/manual-bootstrap.js'])
    .pipe(concat('angular-mapbox-standalone.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build-standalone-stylesheets', function() {
  return gulp.src('lib/**/*.css')
    .pipe(concatCss('angular-mapbox-standalone.css'))
    .pipe(gulp.dest('dist'));
});

gulp.task('build-standalone', ['build-standalone-scripts', 'build-standalone-stylesheets']);

gulp.task('build', ['build-modular', 'build-standalone']);

gulp.task('lint', function() {
  return gulp.src('src/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('watch', ['scripts'], function() {
  var server = livereload();
  gulp.watch('src/**/*.js', ['scripts']);
  gulp.watch('dist/**').on('change', function(file) {
    server.changed(file.path);
  });
});

