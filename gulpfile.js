const gulp = require('gulp');
const concat = require('gulp-concat');
const deleteLines = require('gulp-delete-lines');


gulp.task('pre-test', () => gulp
  .src(['./src/index.js', './test/create-worker.js'])
  .pipe(concat('bundle.js'))
  .pipe(deleteLines({
    filters: [/export default */],
  }))
  .pipe(gulp.dest('./test/')));
