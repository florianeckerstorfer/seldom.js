var gulp        = require('gulp'),
    concat      = require('gulp-concat')
    sass        = require('gulp-sass'),
    sourcemaps  = require('gulp-sourcemaps'),
    uglify      = require('gulp-uglifyjs'),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload;

var scripts = [
    './src/js/module-pre.js',
    './src/js/seldom.js',
    './src/js/module-post.js'
];

gulp.task('default', ['build']);
gulp.task('build', ['css-build', 'js-build']);
gulp.task('dist', ['css-dist', 'js-dist']);

gulp.task('css-dist', function () {
    gulp.src('./src/scss/seldom.scss')
        .pipe(sass())
        .pipe(gulp.dest('./dist'));
});

gulp.task('css-build', function () {
    gulp.src('./src/scss/seldom.scss')
        .pipe(sass())
        .pipe(gulp.dest('./build'))
        .pipe(reload({stream: true}));
});

gulp.task('js-dist', function () {
    gulp.src(scripts)
        .pipe(concat('seldom.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(uglify('seldom.min.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('js-build', function () {
    gulp.src(scripts)
        .pipe(sourcemaps.init())
        .pipe(concat('seldom.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build'));
});

gulp.task('serve', function() {
    browserSync({server: {baseDir: "./"}});

    gulp.watch("src/scss/*.scss", ['css-build']);
    gulp.watch("src/js/*.js", ['js-build', reload])
    gulp.watch("*.html").on('change', reload);
});

