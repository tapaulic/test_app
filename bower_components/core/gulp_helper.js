const runSequence = require('run-sequence');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const remoteSrc = require('gulp-remote-src');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const useref = require('gulp-useref');
const gulpIf = require('gulp-if');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const htmlmin = require('gulp-htmlmin');
const cache = require('gulp-cache');
const notify = require('gulp-notify');
const imagemin = require('gulp-imagemin');
const inject = require('gulp-inject');
const preprocess = require('gulp-preprocess');
const git = require('gulp-git');
const replace = require('gulp-replace');
const del = require('del');
const browserSync = require('browser-sync').create();
const env = require('node-env-file');
const fs = require("fs");

/*
 Usage:
 #1 Add this to the top of your gulpfile:
 const coreGulpHelper = require('./bower_components/core/gulp_helper');

 #2 Make sure you have all of the above npm packages installed in your node package file.

 #3.1 For standalone apps, add the following lines into any HTML files that need to load the core:
 <!-- insert html5shiv libs -->
 <!--[if lt IE 9]>
 <!-- shiv:js -->
 <!-- endinject -->
 <![endif]-->

 <!-- insert core javascript libraries -->
 <!-- core:js -->
 <!-- endinject -->

 <!-- insert core css libraries -->
 <!-- core:css -->
 <!-- endinject -->
 <!-- core_print:css -->
 <!-- endinject -->

 See scaffold/src/index.html for usage examples

 #3.2 For embedded apps, there are a different set of HTML comments to insert.
 See scaffold_embedded/src/index.html for usage

 #4 Somewhere in a gulp task, call the inject method below to insert the script and link tags into your html files.
 */
const GulpHelper = {
  embeddedApp: {
    //gulp: your gulp instance
    //options: a javascript key/value pair object. see initializer for options

    createTasks: (gulp, options) => { //for embedded apps, this creates all the required tasks
      options = Object.assign({
        pkg: null, //Required for release task. the app's package.json file as a javascript object. when specified, appName and config can be omitted
        appName: (options['pkg'] || {})['name'], //Required unless pkg is specified. The name of the app. This is used to create build and distribution folders.
        config: (options['pkg'] || {})['coreConfig'], //Required unless pkg is specified. The coreConfig options from the app's package.json
        embedArea: 'full', //Optional. Where this app should be embedded in the simulator: 'full', 'left', or 'right'
        environmentOverride: null, //Optional, set to 'local', 'dev', 'qa', or 'prod' to force a build for a specified environment
        preprocessorContext: {}
        /*
         Developers can use the preprocessorContext option to add to the preprocessor context
         They can add environment specific items or generic items.
         ex:
         core.embeddedApp.createTasks(gulp, {
           ...
           preprocessorContext: {
             local: {
             ... these vars will only be in the context in the local environment ...
             },
             dev: {
             ... these vars will only be in the context in the local environment ...
             }
             OTHER: 'this var will be in the context of any environment'
           }
           ...
         });
         */
      }, options);

      if (!options['config'] || !options['appName']) {
        throw new Error('config and appName are both required for createTasks options');
      }

      let QA_RELEASE = (options.pkg || {})['qaRelease'];
      let VERSION = (options.pkg || {})['version'];

      //load env variables
      try {
        env('./.env');
      } catch (err) {
        process.stdout.write('Warning!!: no .env file found\n');
      }

      //what is the deployment environment?
      let deployment_environment = options['environmentOverride'] || 'local';

      function preprocessorOptions() {
        /*
         Core uses https://www.npmjs.com/package/gulp-preprocess to allow for preprocessing

         See https://github.com/jsoverson/preprocess#directive-syntax for more about preprocessor syntax

         ex:
         // @if ENV='local' || ENV='dev'
         console.log('running on local or dev');
         // @endif

         Any variables inside your .env file will be available to preprocessor statements
         Available preprocessor variables:

         ENV
         //the current build environment: local, dev, qa, or prod

         CC.<SECURE or NONSECURE>.<INTER or INTRA>.<PROTOCOL or HOSTNAME or PATHNAME or ORIGIN or HREF>
         //use this to get common component url information for the current environment
         //ex: CC.SECURE.INTER.ORIGIN will return https://was-inter-sit.toronto.ca for the 'dev' environment
         //ex: CC.SECURE.INTRA.HREF will return https://was-intra-sit.toronto.ca/cc_sr_admin_v1/ for the 'dev' env
         */
        let env = deployment_environment;
        let qaRelease = QA_RELEASE || 'unavailable';
        let version = VERSION || 'unavailable';
        let BUILD_ID = new Date();
        BUILD_ID = [BUILD_ID.getFullYear(),BUILD_ID.getMonth()+1, BUILD_ID.getDate(), BUILD_ID.getHours(), BUILD_ID.getMinutes(), BUILD_ID.getSeconds()].join('-');
        let opt = {
          context: {
            ENV: env,
            QA_RELEASE: qaRelease,
            VERSION: version,
            BUILD_ID,
            startBuildTagWithCacheBuster: function (file, params) {
              //file: Required. The name of the file to build. ex: 'scripts/main.css'
              //params: Optional. Additional params to go in file tag. ex: 'media="print"'
              let ext = file.split('.')[1];
              let path = file.split('.')[0];
              let cacheBust = env === 'prod' ? version : env === 'qa' ? qaRelease : env === 'dev' ? Math.random().toString().split('.')[1] : '';
              return `<!-- build:${ext} /resources/${options['appName']}/${path}${cacheBust}.${ext} ${params || ''} -->`;
            },
            CC: {
              SECURE: {
                INTER: GulpHelper.commonComponentLocation({env, secure: true, network: 'inter'}),
                INTRA: GulpHelper.commonComponentLocation({env, secure: true, network: 'intra'})
              },
              NONSECURE: {
                INTER: GulpHelper.commonComponentLocation({env, secure: false, network: 'inter'}),
                INTRA: GulpHelper.commonComponentLocation({env, secure: false, network: 'intra'})
              }
            }
          }
        };

        if (options['preprocessorContext']) {
          for(let name in options['preprocessorContext']) {
            if (options['preprocessorContext'].hasOwnProperty(name)) {
              if (['local', 'dev', 'qa', 'prod'].indexOf(name) === -1) {
                opt.context[name] = options['preprocessorContext'][name];
              } else if (name === env) {
                Object.assign(opt.context, options['preprocessorContext'][name]);
              }
            }
          }
        }
        return opt;
      }

      //should we minify stuff during tasks? this is set to true in deploy tasks
      let compress = false;

      gulp.task('default', () => {
        return new Promise(resolve => {
          runSequence.use(gulp);
          runSequence('clean', 'build', resolve);
        });
      });

      //a task to remove the temp and dist directories
      gulp.task('clean', () => {
        del.sync(['.tmp', 'dist']);
      });

      //a task to build the project and create the distribution folder
      gulp.task('build', ['_html_styles_scripts', '_images', '_fonts', '_extras', '_bower_extras', '_data']);

      gulp.task('build_with_simulator', ['build'], () => {
        function processSimulatorSrc(stream) {
          let appHtml = gulp.src(['dist/resources/' + options['appName'] + '/html/app.html']);

          function between(string, start, end) {
            let x = string.indexOf(start);
            if (x > -1) {
              //noinspection JSUnresolvedFunction
              string = string.substring(x + start.length);
              let y = string.indexOf(end);
              if (y > -1) {
                //noinspection JSUnresolvedFunction
                return string.substring(0, y);
              }
            }
            return '';
          }

          return stream.pipe(rename((path) => {
            if (path.extname === '.html' || path.basename === 'cframe') {
              path.basename = 'index';
              path.extname = '.html'
            }
          }))
            .pipe(inject(appHtml, {
              starttag: '<!-- cot_app_injection:head -->',
              endtag: '<!-- end_cot_app_injection -->',
              transform: function (filePath, file) {
                return between(file.contents.toString('utf8'), '<!-- cot-app:head -->', '<!-- cot-app:head end-->');
              }
            }))
            .pipe(inject(appHtml, {
              starttag: '<!-- CONTENT -->',
              endtag: '</div>',
              transform: function (filePath, file) {
                let html = '<div class="page-header"><h1>' + options['appName'] + ' Simulator</h1></div>';
                let body = between(file.contents.toString('utf8'), '<!-- cot-app:body -->', '<!-- cot-app:body end-->');
                switch (options['embedArea']) {
                  case 'left':
                    html += '<div class="row"><div id="page-content" class="col-md-8 col-lg-9">' + body + '</div>';
                    html += '<aside class="col-md-4 col-lg-3"></aside></div>';
                    break;
                  case 'right':
                    html += '<div class="row"><div id="page-content" class="col-md-8 col-lg-9"></div>';
                    html += '<aside class="col-md-4 col-lg-3">' + body + '</aside></div>';
                    break;
                  default:
                    html += '<div class="row"><div id="page-content" class="col-xs-12">' + body + '</div></div>';
                }
                return html;
              }
            }))
            .pipe(inject(appHtml, {
              starttag: '<!-- cot_app_injection:footer -->',
              endtag: '<!-- end_cot_app_injection -->',
              transform: function (filePath, file) {
                return between(file.contents.toString('utf8'), '<!-- cot-app:footer -->', '<!-- cot-app:footer end-->');
              }
            }))
            .pipe(gulp.dest('dist'));
        }

        return processSimulatorSrc(remoteSrc(['cframe'], {
          base: 'https://delivery2.elb.wp.inter.dev-toronto.ca/globalnav/',
          buffer: true,
          requestOptions: {
            proxy: process.env['PROXY'] || 'http://proxy.toronto.ca:8080'
          }
        }).on('error', function (e) {
          process.stdout.write('Error loading cframe: ' + e.toString() + '\nUsing barebones default simulator instead\n');
          processSimulatorSrc(gulp.src('bower_components/core/default_simulator.html')
            .pipe(useref({newLine: '\n\n', searchPath: ['.']})));
          //noinspection JSUnresolvedFunction
          this.emit('end');
        }));
      });

      gulp.task('run', () => {
        return new Promise(resolve => {
          runSequence('clean', 'build_with_simulator', '_serve', resolve);
        });
      });

      function copyToNetshare(env){
        let path = process.env['NETSHARE_DRIVE'];
        if (path) {
          path += `/web/content/${env || 'DEV'}/resources/${options['appName']}`;
          process.stdout.write('Deleting existing app at ' + path + '\n');
          del.sync(path, {force: true});
          process.stdout.write('Copying app to ' + path + '.\n');
          if (env === 'STAGE4PROD') {
            process.stdout.write('App will be ready for double rsync to s3 production.\n');
          } else {
            process.stdout.write('rsync should move these changes to s3 within a few minutes.\n');
          }
          return gulp.src('dist/resources/' + options['appName'] + '/**/*.*')
            .pipe(gulp.dest(path));
        } else {
          process.stdout.write('Files are ready in dist/resources/' + options['appName'] + '.\n');
          process.stdout.write(`Please copy to \\\\netshare.toronto.ca\\inet\\web\\content\\${env || 'DEV'}\\resources\\${options['appName']}\n`);
          process.stdout.write('To have this copied automatically next time, do the following:\n');
          process.stdout.write('1. Make sure you have mapped \\\\netshare.toronto.ca\\inet as a network drive on your computer\n');
          process.stdout.write('2. Make sure that you have a .env file in your project (should be in the root folder)\n');
          process.stdout.write('3. Insert the following line into your .env file: NETSHARE_DRIVE=??\n');
          process.stdout.write('4. Replace the ?? with the mapped drive letter and colon, ex: NETSHARE_DRIVE=z:\n');
          process.stdout.write('4.1 Note that on a Mac, this looks different. Something like: NETSHARE_DRIVE=/Volumes/inet \n');
        }
      }
      gulp.task('deploy:dev', ['_deploy_prep:dev'], () => {
        try {
          return copyToNetshare('DEV');
        } catch(e) {
          process.stdout.write('An error occurred: \n' + e.toString());
        }
      });

      gulp.task('deploy:qa', ['_deploy_prep:qa'], () => {
        try {
          return copyToNetshare('QA');
        } catch(e) {
          process.stdout.write('An error occurred: \n' + e.toString());
        }
      });

      gulp.task('deploy:prod', ['_deploy_prep:prod'], () => {
        try {
          return copyToNetshare('STAGE4PROD');
        } catch(e) {
          process.stdout.write('An error occurred: \n' + e.toString());
        }
      });

      gulp.task('release', () => {
        process.stdout.write('checking working copy for changes...\n');
        return git.status({args : '--porcelain'}, function (err, stdout) {
          if (stdout) {
            throw new Error('You cannot proceed until your working copy is clean!');
          } else {
            process.stdout.write('Working copy ok, proceeding\n');
            if (!options.pkg) {
              throw new Error('To use the release task, you must pass in the pkg option to gulp_helper#embeddedApp.createTasks');
            }
            let prod = process.argv.indexOf('--prod') > -1 ? 1 : 0;
            let qa = process.argv.indexOf('--qa') > -1 ? 1 : 0;
            if (prod + qa !== 1) {
              throw new Error('Invalid arguments, specify --qa or --prod\n');
            }
            let deployTask = `deploy:${prod ? 'prod' : 'qa'}`;
            return new Promise(resolve => {
              runSequence('_increment_release_number', deployTask, '_tag_release', resolve);
            });
          }
        });
      });

      gulp.task('_increment_release_number', () => {
        let prod = process.argv.indexOf('--prod') > -1 ? 1 : 0;
        let qa = process.argv.indexOf('--qa') > -1 ? 1 : 0;
        if (qa) {
          let oldNumber = QA_RELEASE || 0;
          let propString = `"qaRelease": ${oldNumber},`;
          if(fs.readFileSync('./package.json', 'utf8').indexOf(propString) === -1) {
            throw new Error(`The qaRelease property in your package.json file is missing or has bad whitespace. It should look like: ${propString}`);
          }
          QA_RELEASE = oldNumber + 1;
          process.stdout.write(`Updating qaRelease from ${oldNumber} to ${QA_RELEASE}\n`);
          return gulp.src('./package.json')
            .pipe(replace(propString, `"qaRelease": ${QA_RELEASE},`))
            .pipe(gulp.dest('./'))
            .pipe(git.commit(`Updated qaRelease property to ${QA_RELEASE}`));
        } else {
          let major = process.argv.indexOf('--major') > -1 ? 1 : 0;
          let minor = process.argv.indexOf('--minor') > -1 ? 1 : 0;
          let patch = process.argv.indexOf('--patch') > -1 ? 1 : 0;
          if (major + minor + patch !== 1) {
            throw new Error('Invalid arguments, specify --major or --minor or --patch');
          }
          let oldVersion = VERSION || 'x.x.x';
          let propString = `"version": "${oldVersion}",`;
          if(fs.readFileSync('./package.json', 'utf8').indexOf(propString) === -1) {
            throw new Error(`The version property in your package.json file is missing or has bad whitespace. It should look like: ${propString}`);
          }
          let a = oldVersion.split('.');
          let i = major ? 0 : minor ? 1 : 2;
          a[i] = (parseInt(a[i]) + 1).toString();
          while (++i < 3) {
            a[i] = '0';
          }
          VERSION = a.join('.');
          process.stdout.write(`Updating version from ${oldVersion} to ${VERSION}\n`);
          return gulp.src('./package.json')
            .pipe(replace(propString, `"version": "${VERSION}",`))
            .pipe(gulp.dest('./'))
            .pipe(git.commit(`Updated version property to ${VERSION}`));
        }
      });

      gulp.task('_tag_release', () => {
        let prod = process.argv.indexOf('--prod') > -1 ? 1 : 0;
        let qa = process.argv.indexOf('--qa') > -1 ? 1 : 0;
        if (prod + qa !== 1) {
          throw new Error('Invalid arguments, specify --qa or --prod\n');
        }
        let tag = prod ? 'r' + VERSION : 'qa' + QA_RELEASE;
        let comment = prod ? 'Release ' + VERSION : 'QA Release ' + QA_RELEASE;
        git.tag(tag, comment, function (err) {
          if (err) throw err;
        });
        process.stdout.write(`HEY! Don't forget to push this release to your git repo!!!:\n\ngit push && git push --tags\n\n`);
      });

      //preprocess syntax: https://github.com/jsoverson/preprocess#directive-syntax
      gulp.task('_html_styles_scripts', ['_styles', '_scripts'], () => {
        return GulpHelper.inject(gulp, inject, gulp.src(['src/*.html']), options['config'])
          .pipe(preprocess(preprocessorOptions()))
          .pipe(useref({newLine: '\n', searchPath: ['.tmp', 'src', '.']}))
          .pipe(gulpIf(compress, gulpIf('*.js', uglify())))
          .pipe(gulpIf(compress, gulpIf('*.css', cssnano({safe: true}))))
          .pipe(gulpIf(compress, gulpIf('*.html', htmlmin({collapseWhitespace: false}))))
          .pipe(rename((path) => {
            if (path.extname === '.html') {
              path.dirname = 'resources/' + options['appName'] + '/html';
            }
          }))
          .pipe(gulp.dest('dist'));
      });

      gulp.task('_styles', () => {
        //noinspection JSUnresolvedVariable
        return gulp.src('src/styles/**/*.scss')
          .pipe(preprocess(preprocessorOptions()))
          .pipe(sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
          }).on('error', sass.logError))
          .pipe(autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
          .pipe(gulp.dest('.tmp/resources/' + options['appName'] + '/styles'));
      });

      gulp.task('_scripts', () => {
        return gulp.src('src/scripts/**/*.js')
          .pipe(preprocess(preprocessorOptions()))
          .pipe(babel({presets: ['es2015']})).on("error", notify.onError(function (error) {
            return error.message;
          }))
          .pipe(gulp.dest('.tmp/resources/' + options['appName'] + '/scripts'));
      });

      gulp.task('_images', () => {
        return gulp.src(['src/img/**/*'])
          .pipe(gulpIf(compress, cache(imagemin())))
          .pipe(gulp.dest('dist/resources/' + options['appName'] + '/img'));
      });

      gulp.task('_fonts', () => {
        return gulp.src(['src/fonts/**/*'])
          .pipe(gulp.dest('dist/resources/' + options['appName'] + '/fonts'));
      });

      gulp.task('_data', () => {
        //override this in your project if you want to do extra stuff during the build task

        //FAKING DATA AND CONFIG FILES:
        //Some apps will load data and configurations from 'data' files, usually JSON.
        //The location of these files in Dev, QA, and Prod may vary:
        //- Could be in the S3 data bucket
        //- Could be in a custom Wordpress post
        //To 'fake' this when running your app locally, do the following:
        // 1. Put some sample data/config files into /src/data folder in the project
        // 2. Overwrite the _data gulp task to copy your data files into a file path that mimics the one on your web server:
        // gulp.task('_data', () => {
        //   let myDataPath = '/data'; //On S3, this will be something like /data/division/my_app
        //                             //On WP, this will be something different
        //   return gulp.src(['src/data/**/*']).pipe(gulp.dest('dist' + myDataPath));
        // });
      });

      gulp.task('_extras', () => {
        return gulp.src([
          'src/*.*',
          '!src/*.html'
        ], {
          dot: true
        }).pipe(gulp.dest('dist/resources/' + options['appName']));
      });

      gulp.task('_bower_extras', () => {
        return GulpHelper.distExtras(gulp, 'dist/resources/' + options['appName'], options['config']);
      });

      gulp.task('_serve', () => {
        gulp.watch('src/fonts/**/*', ['_fonts']);
        gulp.watch('src/img/**/*', ['_images']);
        gulp.watch(['src/*.*', '!src/*.html'], ['_extras']);
        gulp.watch(['src/scripts/**/*.js', 'src/styles/**/*.scss'], ['_html_styles_scripts']);
        gulp.watch(['src/*.html'], ['build_with_simulator']);
        browserSync.init({
          port: 9000,
          server: {
            baseDir: ['dist']
          }
        });
        //could get fancy here and use the stream method for things like CSS, to avoid reloading the whole page
        gulp.watch('dist/**/*').on('change', browserSync.reload);
      });

      //a task to clear the gulp-cache in case images get stuck in there
      gulp.task('_clear_image_cache', (done) => {
        return cache.clearAll(done);
      });

      function deployPrep(e, c) {
        deployment_environment = options['environmentOverride'] || e;
        compress = c;
        return new Promise(resolve => {
          runSequence('_clear_image_cache', 'clean', 'build', resolve);
        });
      }

      gulp.task('_deploy_prep:dev', () => {
        return deployPrep('dev', false);
      });

      gulp.task('_deploy_prep:qa', () => {
        return deployPrep('qa', true);
      });

      gulp.task('_deploy_prep:prod', () => {
        return deployPrep('prod', true);
      });

    }
  },
  inject: (gulp, inject, stream, options) => {
    //gulp is your gulp object
    //inject is your gulp-inject object
    //stream is the result of a call to gulp.src
    //options is an object to specify what to inject:
    /*
     {
     "isEmbedded": true, //defaults to false, set to true if you are building an embedded WCM app
     "includeFormValidation": true, //include formValidation stuff
     "includeEditableSelect": true, //include editableSelect control
     "includePlaceholders": true, //include placeholders shim
     "includeMultiSelect": true, //include multiselect control
     "includeOMS": true, //inlude OMS map multi-marker
     "includeFullCalendar": true, //include full page calendar stuff
     "includeDatePicker": true, //include date picker control
     "includeLogin": true, //include cot login stuff
     "includeRangePicker": true, //include date range picker control
     "includeMoment": true, //include momentjs library
     "includeModeling": true, //include backbonejs stuff
     "includeWebtrends": true, //include webtrends stuff, combine with "environment" to get the right key injected
     "includeBootbox": true, //include bootbox alert control
     "includeDropzone": true, //include dropzone component and helper
     "includeModal": true, //include cot_modal.js, which has the showModal helper method
     "environment": '' //what is the deployment environment? String, default is dev, can be one of: external, internal, qa, dev
     //this determines which webtrends dcsid key is injected.
     }
     */
    //example: coreGulpHelper.inject(gulp, inject, gulp.src(workingDir + '/**/*.html'), package.coreConfig || {}).pipe()...
    let env = options['environment'] || 'dev';
    if (['external', 'internal', 'dev', 'qa'].indexOf(env) === -1) {
      throw new Error('Invalid environment specified: ' + env);
    }
    let shivFiles = options['isEmbedded'] ? [] : [
      './bower_components/html5shiv/dist/html5shiv.js',
      './bower_components/respond/src/respond.js'
    ];
    let coreFiles = options['isEmbedded'] ? [] : [
      './bower_components/jquery/dist/jquery.js',
      './bower_components/bootstrap/dist/js/bootstrap.js',
      './bower_components/bootstrap/dist/css/bootstrap.css'
    ];
    coreFiles = coreFiles.concat([
      './bower_components/jquery.cookie/jquery.cookie.js'
    ]);
    let robotoFiles = options['isEmbedded'] ? [] : [
      './bower_components/roboto-fontface/css/roboto/roboto-fontface.css'
    ];
    let corePrintFiles = [];
    if (options['includeWebtrends'] && !options['isEmbedded']) {
      process.stdout.write('Core gulp helper injecting webtrends with key for environment: ' + env + '\n');
      coreFiles = coreFiles.concat([
        "./bower_components/core/dist/js/webtrends_keys/" + env + ".js",
        "./bower_components/core/dist/js/webtrends.js"
      ]);
    }
    if (options['includeModeling']) {
      process.stdout.write('Core gulp helper injecting underscore/backbone for modeling\n');
      coreFiles = coreFiles.concat([
        "./bower_components/underscore/underscore.js",
        "./bower_components/backbone/backbone.js",
        "./bower_components/core/dist/js/cot_backbone.js"
      ]);
    }
    if (options['includeFormValidation']) {
      process.stdout.write('Core gulp helper injecting cot_forms and formValidation\n');
      coreFiles = coreFiles.concat([
        "./bower_components/core/dist/js/formValidation.min.js",
        "./bower_components/intl-tel-input/build/js/intlTelInput.js",
        "./bower_components/core/dist/js/cot_forms.js",
        "./bower_components/jquery.maskedinput/dist/jquery.maskedinput.js",
        "./bower_components/core/dist/css/formValidation.min.css",
        "./bower_components/intl-tel-input/build/css/intlTelInput.css"
      ]);
      if (options['isEmbedded']) {
        coreFiles = coreFiles.concat([
          './bower_components/core/dist/css/embedded_cot_forms.css'
        ]);
      }
    }
    if (options['includeEditableSelect']) {
      process.stdout.write('Core gulp helper injecting jquery-editable-select\n');
      coreFiles = coreFiles.concat([
        "./bower_components/jquery-editable-select/dist/jquery-editable-select.js",
        "./bower_components/jquery-editable-select/dist/jquery-editable-select.css"
      ]);
    }
    if (options['includePlaceholders']) {
      process.stdout.write('Core gulp helper injecting jquery placeholders\n');
      coreFiles = coreFiles.concat(['./bower_components/placeholders/dist/placeholders.jquery.js']);
    }
    if (options['includeMultiSelect']) {
      process.stdout.write('Core gulp helper injecting bootstrap-multiselect\n');
      coreFiles = coreFiles.concat([
        './bower_components/bootstrap-multiselect/dist/js/bootstrap-multiselect.js',
        './bower_components/core/dist/js/cot_multiselect.js',
        './bower_components/bootstrap-multiselect/dist/css/bootstrap-multiselect.css'
      ]);
    }
    if (options['includeOMS']) {
      process.stdout.write('Core gulp helper injecting OMS for google maps\n');
      coreFiles = coreFiles.concat(['./bower_components/core/dist/js/oms.min.js']);
    }
    if (options['includeMoment'] || options['includeFullCalendar'] || options['includeDatePicker'] || options['includeRangePicker']) {
      process.stdout.write('Core gulp helper injecting momentjs\n');
      coreFiles = coreFiles.concat(['./bower_components/moment/min/moment-with-locales.js']);
    }
    if (options['includeFullCalendar']) {
      process.stdout.write('Core gulp helper injecting fullcalendar\n');
      coreFiles = coreFiles.concat(['./bower_components/fullcalendar/dist/fullcalendar.js']);
      coreFiles = coreFiles.concat(['./bower_components/fullcalendar/dist/fullcalendar.css']);
      corePrintFiles = corePrintFiles.concat(['./bower_components/fullcalendar/dist/fullcalendar.print.css']);
    }
    if (options['includeDatePicker']) {
      process.stdout.write('Core gulp helper injecting bootstrap-datetimepicker\n');
      coreFiles = coreFiles.concat([
        './bower_components/eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
        './bower_components/eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css'
      ]);
    }
    if (options['includeLogin'] && !options['isEmbedded']) {
      process.stdout.write('Core gulp helper injecting cot_login\n');
      coreFiles = coreFiles.concat(['./bower_components/core/dist/js/cot_login.js']);
    }
    if (options['includeRangePicker']) {
      process.stdout.write('Core gulp helper injecting daterangepicker\n');
      coreFiles = coreFiles.concat([
        './bower_components/bootstrap-daterangepicker/daterangepicker.js',
        './bower_components/bootstrap-daterangepicker/daterangepicker.css'
      ]);
    }
    if (options['includeBootbox']) {
      process.stdout.write('Core gulp helper injecting bootbox\n');
      coreFiles = coreFiles.concat([
        './bower_components/bootbox.js/bootbox.js',
      ]);
    }
    if (options['includeDropzone']) {
      process.stdout.write('Core gulp helper injecting dropzone\n');
      coreFiles = coreFiles.concat([
        './bower_components/dropzone/dist/dropzone.js',
        './bower_components/core/dist/js/cot_dropzone.js',
        './bower_components/dropzone/dist/dropzone.css'
      ]);
    }
    if (options['includeModal']) {
      process.stdout.write('Core gulp helper injecting cot_modal\n');
      coreFiles = coreFiles.concat([
        './bower_components/core/dist/js/cot_modal.js',
      ]);
    }
    if (options['isEmbedded']) {
      coreFiles = coreFiles.concat([
        './bower_components/core/dist/js/embedded_cot_app.js'
      ]);
    } else {
      coreFiles = coreFiles.concat([
        './bower_components/core/dist/js/cot_app.js',
        './bower_components/core/dist/css/cot_app.css'
      ]);
    }

    return stream
      .pipe(inject(gulp.src(shivFiles, {read: false}), {name: 'shiv', relative: true}))
      .pipe(inject(gulp.src(coreFiles, {read: false}), {name: 'core', relative: true}))
      .pipe(inject(gulp.src(robotoFiles, {read: false}), {name: 'roboto', relative: true}))
      .pipe(inject(gulp.src(corePrintFiles, {read: false}), {
        name: 'core_print',
        relative: true,
        transform: function (filePath) {
          if (filePath.slice(-4) === '.css') {
            return '<link rel="stylesheet" type="text/css" media="print" href="' + filePath + '">';
          }
          // Use the default transform as fallback:
          return inject.transform.apply(inject.transform, arguments);
        }
      }));
  },
  distExtras: (gulp, distDir, options) => {
    //gulp is your gulp object
    //distDir is your distribution directory
    //options is the same as the inject method above

    //bootstrap needs font files:
    if (!options['isEmbedded']) {
      gulp.src(['bower_components/bootstrap/dist/fonts/*']).pipe(gulp.dest(distDir + '/fonts'));
    }

    if (!options['isEmbedded']) {
      //Roboto needs font files:
      gulp.src(['./bower_components/roboto-fontface/fonts/Roboto/*']).pipe(gulp.dest(distDir + '/fonts/Roboto'));
    }
    //core and intl-tel-input need images:
    let imageSrcs = options['isEmbedded'] ? [] : ['bower_components/core/dist/img/*'];
    if (options['includeFormValidation']) {
      imageSrcs.push('bower_components/intl-tel-input/build/img/*');
    }
    if (imageSrcs.length > 0) {
      gulp.src(imageSrcs)
        .pipe(gulp.dest(distDir + '/img'));
    }

    //intl-tel-input needs a weird lib build folder with a js util referenced by the core
    if (options['includeFormValidation']) {
      gulp.src('bower_components/intl-tel-input/lib/libphonenumber/build/utils.js')
        .pipe(gulp.dest(distDir + '/js'));
    }

    if (!options['isEmbedded']) {
      //core needs html files
      gulp.src(['bower_components/core/dist/html/*'])
        .pipe(gulp.dest(distDir + '/html'));
    }
  },
  commonComponentLocation: (o) => {

    //the server environment to use: 'dev', 'qa', 'prod'
    let env = o['env'] || 'dev';
    if (env === 'local') {
      env = 'dev'; //treat local like dev when creating URLs
    }

    //whether to use internal (intranet) or external (internet) server: 'intra', 'inter'
    let network = o['network'] || 'intra';

    //whether to use HTTPS or not, boolean, default true
    let secure = o.hasOwnProperty('secure') ? !!o['secure'] : true;

    //the name of the CC Api to use: 'session', 'submit', 'upload', 'data', 'retrieve', 'retrieve/eventrepo'
    let api = o['api'];

    //the name of the CC app, string
    let app = o['app'];

    //a hash of querystring parameters
    let searchParams = o['searchParams'] || {};

    let protocol = secure ? 'https:' : 'http:';

    let hostname = {
        inter: {
          dev: 'was-inter-sit',
          qa: 'was-inter-qa',
          prod: secure ? 'secure' : 'app'
        },
        intra: {
          dev: 'was-intra-sit',
          qa: 'was-intra-qa',
          prod: secure ? 'insideto-secure' : 'insideto'
        }
      }[network][env] + '.toronto.ca';

    let pathname = '/unknown/';
    if (network === 'inter') {
      pathname = secure ? '/cc_sr_v1/' : '/cc_sr_v1_app/';
    } else if (secure) {
      pathname = '/cc_sr_admin_v1/';
    }
    pathname += (api ? api + '/' : '') + (api && app ? app : '');

    let params = [];
    for (let key in searchParams) {
      if (searchParams.hasOwnProperty(key)) {
        params.push(key + '=' + encodeURIComponent(searchParams[key]));
      }
    }
    let search = params.length === 0 ? '' : ('?' + params.join('&'));
    return {
      PROTOCOL: protocol,
      HOSTNAME: hostname,
      PATHNAME: pathname,
      SEARCH: search,
      ORIGIN: protocol + '//' + hostname,
      HREF: protocol + '//' + hostname + pathname + search
    }
  }
};
module.exports = GulpHelper;
