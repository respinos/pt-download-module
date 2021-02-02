'use strict';

const gulp = require('gulp');

const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
// var es = require('event-stream');

const concat = require('gulp-concat');  
// var rename = require('gulp-rename');  
const babel = require('gulp-babel');

const compiler = require('webpack');
const webpack = require('webpack-stream');

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');


var stylesheets = {};
stylesheets.input = [ './src/scss/*.scss' ];
stylesheets.concat = [ './vendor/**/*.css' ];
stylesheets.watch = [ './vendor/**/*.css', './vendor/**/*.scss', './src/scss/**/*.scss' ];
stylesheets.output = './dist/css';

var javascripts = {};
javascripts.input = [];
javascripts.input.push(`${process.env.SDRROOT}/mdp-web/jquery/jQuery-URL-Parser/purl.js`);
javascripts.input.push('./src/js/utils/**/*.js')
javascripts.output = './dist/js';

const distFolder = path.resolve(__dirname);
console.log("AHOY", distFolder);

var apps = {volume: {}, volume_epub: {}};
apps.volume.input = [];
apps.volume_epub.input = [];
apps.volume.input.push(
  './src/js/components/**/*.js', 
  './src/js/main.js');
apps.volume_epub.input.push(
  './src/js/volume_epub/main.js',
  './src/js/volume_epub/components/**/*.js');
apps.output = "./js";

stylesheets.options = {
  errLogToConsole: true,
  outputStyle: 'expanded',
  includePaths: ['node_modules']
};

var autoprefixerOptions = {
  // browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};

// Compile sass into CSS
gulp.task('sass', function() {

  var vendorFiles = gulp.src(stylesheets.concat);

  // var localFiles = gulp.src('./src/scss/main.scss')
  //   .pipe(sass(stylesheets.options).on('error', sass.logError))
  //   .pipe(autoprefixer(autoprefixerOptions));

  // return es.concat(vendorFiles, localFiles)
  //   .pipe(concat('main.css'))
  //   .pipe(sourcemaps.write())
  //   .pipe(gulp.dest(stylesheets.output));

  return gulp.src(stylesheets.input)
    .pipe(sass(stylesheets.options).on('error', sass.logError))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(stylesheets.output));
});

var presets_v6 = [ '@babel/preset-env' ].map(require.resolve);
gulp.task('scripts', function() {
  return gulp.src(javascripts.input)
    .pipe(sourcemaps.init())
    .pipe(babel({
      babelrc: false,
      presets: presets_v6
      // exclude: [ 'node_modules/**' ]
    }))
    .pipe(concat('utils.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(javascripts.output))
})

gulp.task('app', function() {
  return gulp.src('./src/js/main.js')
    .pipe(webpack({
      watch: false,
      devtool: 'inline-source-map',
      mode: 'development',
      entry: {
        main: [ 'intersection-observer', 'whatwg-fetch', './src/js/main.js']
      },
      output: {
        filename: 'js/main.js'
      },
      module: {
        rules: [
          { test: /\.js$/, 
            use: {
              loader: 'babel-loader',
              options: {
                presets: [ '@babel/preset-env' ]
              }
            }
          },
          {
            test: /\.css$/i,
            use: [ 'style-loader', 'css-loader' ]
          },
        ]
      },
      plugins: [
        new CopyPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'node_modules/@shoelace-style/shoelace/dist/shoelace/icons'),
              to: path.resolve(__dirname, 'dist/shoelace/icons')
            }
          ]
        })
      ]
    }, compiler, function(err, stats) {

    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('volume_epub', function() {
  return gulp.src('./src/js/volume_epub/main.js')
    .pipe(webpack({
      watch: false,
      devtool: 'inline-source-map',
      mode: 'development',
      entry: {
        main: [ 'intersection-observer', 'babel-polyfill', 'whatwg-fetch', './src/js/volume_epub/main.js']
      },
      output: {
        filename: 'volume_epub/main.js'
      },
      module: {
        rules: [
          { test: /\.js$/, 
            use: {
              loader: 'babel-loader',
              options: {
                presets: [ 'env' ]
              }
            }
          }
        ]
      }
    }, compiler, function(err, stats) {

    }))
    .pipe(gulp.dest(javascripts.output));
});

gulp.task('sass:watch', function () {
  gulp.watch(stylesheets.watch, gulp.parallel('sass'));
});

gulp.task('scripts:watch', function () {
  gulp.watch(javascripts.input, gulp.parallel('scripts'));
});

gulp.task('app:watch', function () {
  gulp.watch(apps.volume.input, gulp.parallel('app'));
});

gulp.task('volume_epub:watch', function () {
  gulp.watch(apps.volume_epub.input, gulp.parallel('volume_epub'));
});

gulp.task('default', gulp.parallel('sass:watch', 'app:watch', 'volume_epub:watch', 'scripts:watch'));
gulp.task('run', gulp.series('sass', 'scripts', 'app', 'volume_epub'));

gulp.task('netlify:dist', function() {
  return gulp.src('./dist/**/*')
  .pipe(gulp.dest('./build/2021/dist'))
})

gulp.task('netlify:files', function() {
  return gulp.src('../index.html')
  .pipe(gulp.src('../*.xml'))
  .pipe(gulp.src('../pt.2021.xsl'))
  .pipe(gulp.dest('./build'))
})

gulp.task('netlify:2021', function() {
  return gulp.src(['*.xsl', '*.xml'])
    .pipe(gulp.dest('./build/2021'));
})

gulp.task('netlify:mdp-web', function() {
  return gulp.src('../mdp-web/**/*')
  .pipe(gulp.dest('./build/mdp-web'))
})

gulp.task('netlify:common', function() {
  return gulp.src('../common/**/*')
  .pipe(gulp.dest('./build/common'))
})

gulp.task('netlify', gulp.series('netlify:dist', 'netlify:files', 'netlify:2021', 'netlify:mdp-web', 'netlify:common'));
