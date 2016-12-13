var gulp = require('gulp');
var purify = require('gulp-purifycss');
var cleanCSS = require('gulp-clean-css');
var htmlreplace = require('gulp-html-replace');
var amphtmlValidator = require('amphtml-validator');
var fs = require('fs');

const BUILD_PATH = './build';
const BUILD_HTML = BUILD_PATH + '/index.html';
const SOURCE = {
  'BOOTSTRAP_CSS': './html/css/bootstrap.min.css',
  'AMPHTML': './amphtml/index.html',
  'CLEANED_CSS': './amphtml/css/bootstrap.min.css'
}

// purify removes unused CSS classes
gulp.task('purify', function() {
  return gulp.src(SOURCE.BOOTSTRAP_CSS)
    .pipe(purify([SOURCE.AMPHTML]))
    .pipe(gulp.dest('./amphtml/css'));
});

// inline-css inserts the cleaned + minified CSS into HTML
gulp.task('inline-css', ['purify'], function() {
  return gulp.src(SOURCE.AMPHTML)
    .pipe(htmlreplace({
      'cssInline': {
        'src': gulp.src(SOURCE.CLEANED_CSS).pipe(cleanCSS()),
        'tpl': '<style amp-custom>%s</style>'
      }
    }))
    .pipe(gulp.dest(BUILD_PATH));
});

// validate ensures the AMP HTML is valid
gulp.task('validate', function() {
  amphtmlValidator.getInstance().then(function (validator) {
    var input = fs.readFileSync(BUILD_HTML, 'utf8');
    var result = validator.validateString(input);
    ((result.status === 'PASS') ? console.log : console.error)(BUILD_HTML + ": " + result.status);
    for (var ii = 0; ii < result.errors.length; ii++) {
      var error = result.errors[ii];
      var msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
      if (error.specUrl !== null) {
        msg += ' (see ' + error.specUrl + ')';
      }
      ((error.severity === 'ERROR') ? console.error : console.warn)(msg);
    }
  });
});

// Build task cleans the CSS and inlines it
gulp.task('build', ['inline-css']);
// Default task will only validate the build output
gulp.task('default', ['validate']);
