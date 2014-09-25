var fs = require('fs');
var gulp = require('gulp');
var coffee = require('gulp-coffee');
var watch = require('gulp-watch');
var jshint = require('gulp-jshint');

require('jshint-stylish');

gulp.task('watch', function() {
    gulp.watch(['src/**/*.coffee'], ['coffee']);
});
gulp.task('observe', function() {
    gulp.watch(['src/**/*.coffee'], ['copy']);
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

gulp.task('optimize', ['coffee'],function(cb){
    var requirejs = require('requirejs');
    var config = {
        baseUrl: "build/public",
        optimize: "none",
        paths: {
            q: "vendor/q"
        },
        exclude: [ "q" ],
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

gulp.task('copy', ['optimize'],function(cb){
    var config = {
        out: "build/dist/dparser.min.js"
    };
    var oldFile = fs.createReadStream(config.out);
    var newFile = fs
        .createWriteStream('/home/c301/JOB/Rooof/extension/chrome-extension/src/js/syndication/dparser.min.js');
    oldFile.on('end', function () {
      console.log('Copy end');
      cb();
    });
    oldFile.pipe(newFile);
});
