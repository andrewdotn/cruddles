const gulp = require("gulp");

// Workaround for https://github.com/gulpjs/gulp/issues/1487
// “Gulp 4: gulp.parallel will stop gulp immediately when one task fails”
//
// Note that this workaround can’t go into a .ts file because ES6 modules
// export bindings, not values
// https://stackoverflow.com/questions/45997225/error-ts2539-cannot-assign-to-c-because-it-is-not-a-variable

// @ts-ignore
gulp._settle = true;

module.exports = gulp;
