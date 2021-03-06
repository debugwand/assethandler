/**
 * Grunt tasks for handling assets
 * Removes dependency on specific framework for asset pipeline
 * INSTRUCTIONS:
 * Specify folder locations in tasks/options/grunt-folders.json
 * Keep JS and CSS files you work on in seperate folders from destination (e.g. public) folder. 
 * CAREFUL: JS and CSS destination folders get cleaned programatically.
 * JS: Specify JS file groupings in asset folder as js.json. Use grunt globbing pattern to specify folders
 * CSS: put main scss and print scss file in root (along with any other file that you want as a standalone css file) all other scss files in a subfolder (e.g. src)
 * Run 'grunt' from the command line to get sass, linting and image handling occurring while you work
 * Run 'grunt build' to run the full build task set
 */
module.exports = function(grunt) {
    var folders = grunt.file.readJSON('grunt-folders.json');
    var jsMap = grunt.file.readJSON(folders.js.src + '/jsmanifest.json');
    require('time-grunt')(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssHashFormat: '.{{hash}}.min.css',
        jsHashFormat: '.{{hash}}.min.js',
        sass: {
            options: {
                banner: '/* THIS IS A COMPILED FILE. DO NOT EDIT DIRECTLY. USE THE SCSS FILES IN '  + folders.css.src.toUpperCase() + ' */'
            },
            dist: {
        
                files: [{
                    expand: true,
                    cwd: folders.css.src,
                    src: ['*.scss'],
                    dest: folders.css.src,
                    ext: '.css'
                }]
            }
        },
        csslint: { //test css that has been produced by sass
            options: {
                csslintrc: '.csslintrc'
            },
            strict: {
                options: {
                    import: 2
                },
                src: [folders.css.src + '/**/*.css']
            },
            lax: {
                options: {
                    import: false
                },
                src: [folders.css.src + '/**/*.css']
            }
        },
        cssmin: {  //export minified css
            minify: {
            expand: true,
            cwd: folders.css.src,
            src: ['*.css', '!*.min.css'],
            dest: folders.css.src,
            ext: '.min.css'
          }
        },
        // styleguide: { //undecided. lots of overhead, adding html fixtures in comments in css files
        //     options: {
        //       name: 'Generated styleguide'
        //     },
        //     dist: {
        //         files: {
        //             'docs/css': folders.css.src + '/*.scss'
        //         }
        //     }
        // },
        //JS
        jshint: {
            files: [folders.js.src + '/**/*.js']
        },
        jasmine: {
            testdev: {
                src: folders.js.src + '/**/*.js',
                options: {
                    'specs': folders.spec.src + '/*Spec.js',
                    'helpers': folders.spec.src + '/*Helper.js',
                    'ignoreEmpty': true
                }
            },
            testprod: {
                src: folders.js.dest + '/**/*.js',
                options: {
                    'specs': folders.spec.src + '/*Spec.js',
                    'helpers': folders.spec.src + '/*Helper.js',
                    'ignoreEmpty': true
                }
            },
            coverage: {  //'istanbul' coverage, non-failing
                src: folders.js.src + '/**/*.js',
                options: {
                    'specs': folders.spec.src + '/*Spec.js',
                    'helpers': folders.spec.src + '/*Helper.js',
                    'template': require('grunt-template-jasmine-istanbul'),
                    'templateOptions': {
                        'coverage': folders.spec.coverage  + '/coverage.json',
                        'report': [
                            {'type': 'html', options: {dir: folders.spec.coverage}},
                            {'type': 'cobertura', options: {dir: folders.spec.coverage + '/cobertura'}},
                            {'type': 'text-summary'}
                        ],
                        'thresholds': { //dont' force fail on lack of coverage
                            'lines': 0,
                            'statements': 0,
                            'branches': 0,
                            'functions': 0
                        }
                    }
                }
            }
        },
        uglify: { //minify and concat js
            target: {
                files: (function () { //result in [public/folder/filename.min.js = {srcfiles/file.js, /srcfiles/file2.js}] etc
                    var obj = {};
                    var group;
                    var fileName;
                    for (group in jsMap) {
                        fileName = folders.js.dest + '/' + group + '.min.js';
                        obj[fileName] = jsMap[group];
                    }
                    return obj;
                }())
            }
        },
        
        //images
        imagemin: {//NB: crunch gifs and jpgs only, pngs are just copied (in seperate task)
            dynamic: {
                files: [{
                    expand: true,
                    cwd: folders.img.src,
                    src: '**/*.{jpg,gif}',
                    dest: folders.img.dest,
                }]
            }
        },
        copy: { 
            pngs: { //for pngs
                files: [
                    {
                        'expand': true,
                        'cwd': folders.img.src,
                        'src': '**/*.png',
                        'dest': folders.img.dest,
                        'filter': 'isFile'
                    }
                ]
            },
            js : { //for js in dev mode
                files: [{
                    expand: true,
                    cwd: folders.js.src,
                    src: '**/*.js',
                    dest: folders.js.dest
                }]
            }
        },
        favicons: { //favico and all the mobile variants
            options: {
                html: folders.img.out + '/icons.html',
                HTMLPrefix: folders.img.icons.dest.replace(folders.output_redirect_path[0] + '/', folders.output_redirect_path[1]) + '/'
            },
            icons: {
                src: folders.img.icons.src,
                dest: folders.img.icons.dest
            }
        },
        //watch for file updates
        watch: {
            css: {
                files: folders.css.src + '/**/*.scss',
                tasks: ['clean:on_sass', 'sass', 'csslint', 'cssmin', 'hashify:css', 'assetincludes:css' ]
            },
            images: {
                files: folders.img.src + '/**/*.*',
                tasks: ['images'],//runs over entire folder :(
                options: {
                    event: ['added', 'changed']
                }
            },
            images_del: {
                files: folders.img.src + '/**/*.*',
                tasks: [],//on watch as below. maybe make own task?
                options: {
                    event: ['deleted']
                }
            },
            icons: {
                files: folders.img.icons.src,
                tasks: ['favicons']
            },
            js: {
                files: [folders.js.src + '/**/*.js', folders.spec.src + '/**/*.js'],
                tasks: ['jshint', 'jasmine:testdev', 'copy:js', 'jasminecoverage', 'assetincludes:js']
            },
            jsmanifest: {
                files: [folders.js.src + '/jsmanifest.json'],
                tasks: ['clean:on_manifest', 'assetincludes:js']
            }
        },
        //versioning via hashes of md5 content
        hashify: {
            css: {
                options: {
                    copy: false, // remove originals
                    hashmap: folders.css.out + '/hashmap.json'
                },
               
                files: [{
                    expand: true,
                    cwd: folders.css.src,
                    src: '**/*.min.css',
                    dest: folders.css.dest,
                    ext: '<%= cssHashFormat %>'
                    
                }]
            },
            js: {
                options: {
                    copy: false, // remove originals
                    hashmap: folders.js.out + '/hashmap.json'
                },
               
                files: [{
                    expand: true,
                    cwd: folders.js.dest,
                    src: '**/*.min.js',
                    dest: folders.js.dest,
                    ext: '<%= jsHashFormat %>'
                    
                }]
            }
        },
        assetincludes: { //create include files for js and css in different environments
            css: {
                options: {
                    hashifyMap: folders.css.out + '/hashmap.json',
                    dest: folders.css.out,
                    hashtemplate: folders.css.dest.replace(folders.output_redirect_path[0] + '/', folders.output_redirect_path[1]) + '/{{file}}<%= cssHashFormat %>'
                }
            },
            js: {
                options: {
                    hashifyMap: folders.js.out + '/hashmap.json',
                    manifest: jsMap,
                    dest: folders.js.out,
                    assetsrc: folders.js.src,
                    siteroot: folders.js.dest.replace(folders.output_redirect_path[0] + '/', folders.output_redirect_path[1]),
                    template: '<script src="{{file}}"></script>',
                    hashtemplate: folders.js.dest.replace(folders.output_redirect_path[0] + '/', folders.output_redirect_path[1]) + '/{{file}}<%= jsHashFormat %>'
                }
            }
        },
        clean: { //delete contents of given folders to work with a clean set
            on_min: [folders.js.dest + '/**/*.js', folders.css.dest + '/**/*.css'],
            on_img: [folders.img.dest],
            on_manifest: [folders.js.out + '/*.{dev,prod}'],
            on_sass: [folders.css.src + '/*.css', folders.css.out]
        },
        notify: { //throw alerts in addition to failures
            dev: {
                options: {
                    title: 'COMPLETE',
                    message: 'Ready to work'
                }
            },
            build: {
                options: {
                    title: 'BUILD COMPLETE',
                    message: 'End of build process'
                }
            }
        }
    });


    //load plugins and custom tasks
    require('load-grunt-tasks')(grunt, {pattern: ['grunt-*', '!grunt-template-*']});
    
    
   //setup tasks
    grunt.registerTask('default', ['setup', 'lint', 'cssmin', 'hashify:css', 'copy:js', 'assetincludes', 'watch', 'notify:dev']);//use this when developing to autoupdate css and images
    grunt.registerTask('images', ['imagemin', 'copy:pngs']);//watched via dev task
    //testing
    
    //jasmine coverage fails catastrophically if there are no js files present, so check for files
    grunt.registerTask('jasminecoverage', function () {
        if (grunt.file.expand(folders.js.src + "/**/*.js").length > 0) {
            grunt.task.run("jasmine:coverage")       
        }     
    });
    grunt.registerTask('jasminetests', ['jasmine:testdev', 'jasmine:testprod'])
    grunt.registerTask('lint', ['csslint', 'jshint']);//linting on assets on build and on demand
    grunt.registerTask('tests', ['lint', 'jasminetests', 'jasminecoverage']);//unit tests
    grunt.registerTask('minify', ['cssmin', 'uglify']);
    //build
    grunt.registerTask('setup', ['clean', 'sass', 'images', 'favicons']);
    grunt.registerTask('fingerprint', ['hashify', 'assetincludes']);//make prod files and their references
    grunt.registerTask('build', ['setup', 'minify', 'tests', 'fingerprint', 'notify:build']); //everything

    //this function caters for the situation in which an image file is deleted.
    //Instead of cleaning the whole folder, it deletes the specific file
    //There is probably a better way to do this, perhaps with a template or a different task
    
    grunt.event.on('watch', function(action, filepath, target) {    
        var file;
        if (filepath.indexOf(folders.img.src) > -1 && action === 'deleted') {//specifically track image deletion
            file = filepath.replace(folders.img.src, folders.img.dest);
            if (grunt.file.exists(file)) {
                grunt.file.delete(file);
                grunt.log.write(file + ' deleted ');
            }    
        }
    });
};

//TODO: awaiting feedback on pull req for jasmine update

//
//todo: loadscreens, js docs?
//todo: better way of handling individual deletes on images
//todo: images are not versioned, could be nicer. hashify src in templates, sass - usemin? only update changed?
//TODO: nice-to-have warning file in any folder that gets CLEANED
//TODO: can we check for an install non-node dependencies?
