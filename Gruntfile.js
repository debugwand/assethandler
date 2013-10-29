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

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssHashFormat: '.{{hash}}.min.css',
        jsHashFormat: '.{{hash}}.min.js',
        sass: {
            dist: {
                options: {
                    //banner: '/* THIS IS A COMPILED FILE. DO NOT EDIT DIRECTLY. USE THE SCSS FILES IN */'// + folders.css.src.toUpperCase() + ' */'
                },
                files: [{
                    expand: true,
                    cwd: folders.css.src,
                    src: ['*.scss'],
                    dest: folders.css.src,
                    ext: '.css'
                }]
            }
        },
        csslint: {
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
        cssmin: {
            minify: {
            expand: true,
            cwd: folders.css.src,
            src: ['*.css', '!*.min.css'],
            dest: folders.css.dest,
            ext: '.min.css'
          }
        },
        styleguide: { //undecided. lots of overhead, adding html fixtures in comments.
            options: {
              name: "Generated styleguide"
            },
            dist: {
                files: {
                    'docs/css': folders.css.src + "/*.scss"
                }
            }
        },
        //JS
        jshint: {
            files: [folders.js.src + '/**/*.js']
        },
        jasmine: {
            testdev: {
                src: folders.js.src + '/**/*.js',
                options: {
                    'specs': folders.spec.src + '/*Spec.js',
                    'helpers': folders.spec.src + '/*Helper.js'
                }
            },
            testprod: {
                src: folders.js.dest + '/**/*.js',
                options: {
                    'specs': folders.spec.src + '/*Spec.js',
                    'helpers': folders.spec.src + '/*Helper.js'
                }
            },
            coverage: {
                src: folders.js.src + '/**/*.js',
                options: {
                    'specs': folders.spec.src + '/*Spec.js',
                    'helpers': folders.spec.src + '/*Helper.js',
                    'template': require('grunt-template-jasmine-istanbul'),
                    'templateOptions': {
                        'coverage': folders.js.coverage  + '/coverage.json',
                        'report': [
                            {'type': 'html', options: {dir: folders.js.coverage}},
                            {'type': 'cobertura', options: {dir: folders.js.coverage + '/cobertura'}},
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
        uglify: { //minify and concat
            options:{
                mangle: {
                    except: ['vendor/**/*.js']
                }
            },
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
        copy: { //for pngs
            pngs: {
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
            js : {
                files: [{
                    expand: true,
                    cwd: folders.js.src,
                    src: '**/*.js',
                    dest: folders.js.dest
                }]
            }
        },
        favicons: {
            options: {
                html: folders.img.out + '/icons.html',
                HTMLPrefix: folders.img.icons.dest.replace(folders.output_redirect_path[0] + "/", folders.output_redirect_path[1]) + "/"
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
                tasks: ['sass', 'csslint']
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
                tasks: ['jshint', 'jasmine:testdev']
            },
            jsmanifest: {
                files: [folders.js.src + '/jsmanifest.json'],
                tasks: ['writeconfig']
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
                    cwd: folders.css.dest,
                    src: "**/*.min.css",
                    dest: folders.css.dest,
                    ext: "<%= cssHashFormat %>"
                    
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
                    src: "**/*.min.js",
                    dest: folders.js.dest,
                    ext: "<%= jsHashFormat %>"
                    
                }]
            }
        },
        writeconfig: {
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
                    src: folders.js.src,
                    public: folders.js.dest.replace(folders.output_redirect_path[0] + '/', folders.output_redirect_path[1]),//todo: names get confusing
                    template: '<script src="{{file}}"></script>',
                    hashtemplate: folders.js.dest.replace(folders.output_redirect_path[0] + '/', folders.output_redirect_path[1]) + '/{{file}}<%= jsHashFormat %>'
                }
            }
        },
        clean: {
            on_min: [folders.js.dest + "/**/*.js", folders.css.dest + "/**/*.css"],
            on_img: [folders.img.dest]
        },
        notify: {
            dev: {
                options: {
                    title: "COMPLETE",
                    message: "Ready to work"
                }
            },
            build: {
                options: {
                    title: "BUILD COMPLETE",
                    message: "End of build process"
                }
            }
        }
    });


    //load plugins and custom tasks
    require('load-grunt-tasks')(grunt, {pattern: ['grunt-*', '!grunt-template-*']});
    grunt.loadTasks('tasks');
    
   //setup tasks
    grunt.registerTask('default', ['setup', 'cssmin', 'hashify:css', 'writeconfig:css', 'copy:js', 'writeconfig:js', 'lint', 'watch', 'notify:dev']);//use this when developing to autoupdate css and images
    grunt.registerTask('images', ['imagemin', 'copy:pngs']);//watched via dev task
    grunt.registerTask('lint', ['csslint', 'jshint']);//linting on assets on build and on demand
    grunt.registerTask('tests', ['lint', 'jasmine']);//unit tests
    grunt.registerTask('minify', ['cssmin', 'uglify']);
    //build
    grunt.registerTask('setup', ['clean', 'sass', 'images', 'favicons']);
    grunt.registerTask('fingerprint', ['hashify', 'writeconfig']);//make prod files and their references
    grunt.registerTask('build', ['setup', 'minify', 'tests', 'fingerprint', 'notify:build']); //everything

    //this function caters for the situation in which an image file is deleted.
    //Instead of cleaning the whole folder, it deletes the specific file
    //There is probably a better way to do this, perhaps with a template or a different task
    
    grunt.event.on('watch', function(action, filepath, target) {    
        var file;
        if (filepath.indexOf(folders.img.src) > -1 && action === "deleted") {//specifically track image deletion
            file = filepath.replace(folders.img.src, folders.img.dest);
            if (grunt.file.exists(file)) {
                grunt.file.delete(file);
                grunt.log.write(file + " deleted ");
            }    
        }
    });
};

//todo: loadscreens, deployment? js docs?
//images could be nicer. hashify src in templates, sass - usemin? only update changed? 
//
//TODO
//PROBLEM: src folders aren't available to webserver
//SOLNs: copy across non-minified to public, clean all the f'ing time
//will have to reconsider how file mapping etc is going on.
//1) keep source where it is but a) copy to dest and b) leave minific til build
//there will have to be a bit more cleverness with hashify json and writeconfig
//
//watch: sass files all go through main.scss so added, changed or deleted handled there
//watch: js files would have to be cleaned each time there was a deletion?
//js watching: lint it, test it, copy it
//


