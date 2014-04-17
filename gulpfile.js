var gulp = require('gulp');
var coffee = require('gulp-coffee');
var watch = require('gulp-watch');
var jshint = require('gulp-jshint');

require('jshint-stylish');

gulp.task('watch', function() {
    gulp.watch(['src/**/*.coffee'], ['coffee']);
});

gulp.task('coffee', function() {
    var coffeeStream = coffee({bare: true, sourceMap: false});
    coffeeStream.on('error', function(){
        console.log('!!! Error');
        console.log(arguments);
        coffeeStream.emit('end');
    });

    return gulp.src(['src/**/*.coffee'])
        .pipe(coffeeStream)
        .pipe(gulp.dest('build/'));
});

gulp.task('jshint', function() {
    return gulp.src('build/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
});

gulp.task('optimize', function(cb){
    var requirejs = require('requirejs');
    var config = {
        baseUrl: "build/public",
        paths: {
            q: "vendor/q"
        },
        name: "parser",
        out: "build/dist/dparser.min.js"
    };

    requirejs.optimize(config, function (buildResponse) {
        console.log( buildResponse);
        //buildResponse is just a text output of the modules
        //included. Load the built file for the contents.
        //Use config.out to get the optimized file contents.
        cb();
    }, function(err) {
        //optimization err callback
        console.log( err );
        cb(err);
    });
});