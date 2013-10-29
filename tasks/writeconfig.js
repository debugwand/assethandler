module.exports = function (grunt) {
    var fs = require('fs');
    var _ = require('lodash');
    grunt.registerMultiTask('writeconfig', 'create asset output files for dev and prod environments', function () {
        var options = this.options();
        
        var hashifyMap = (grunt.file.exists(options.hashifyMap)) ? grunt.file.readJSON(options.hashifyMap) : false;
        
        // replace {{ }} template matches with <%= %> (which would be stripped if sent straight through)
        var convertTemplateDelimiters = function (templateStr) { 
            return templateStr.replace(/{{/g, "<%=").replace(/}}/g, "%>");
        };
        var hashFormatTemplate = (options.hashtemplate) ? _.template(convertTemplateDelimiters(options.hashtemplate)) : false;
        var outputTemplate = (options.template) ? _.template(convertTemplateDelimiters(options.template)) : false;

        //calculate output filename
        var outFileName = function (name, env) {
            return options.dest + '/' + name + '.' + env;
        };
        //apply the output template if there is one
        var codeTemplate = function (file) {
            return (outputTemplate ? outputTemplate({file: file}) : file);
        };
        //write out the file
        var writeFile = function (name, out) {
            grunt.file.write(name, out);
            grunt.log.write('File ' + name + ' created\n');
        };
        //build the production file based on the hashifymap
        var buildProdFile = function (hMap) {
            var fname = '';
            var outname = '';
            var contents = '';
            var afname;
            _.each(hMap, function (val, key) {//hashify json is formatted {old/file: md5hash}
                afname = key.split("/");
                fname = afname[afname.length - 1];
                fname = fname.split('.')[0];
                outname = outFileName(fname, 'prod');
                contents = hashFormatTemplate({file: fname, hash: val});
                contents = codeTemplate(contents);
                writeFile(outname, contents);
            });
        };
        
        //create a list of seperated files based on the manifest
        var buildDevFile = function (manifest) {
            var outname;
            var contents;
            _.each(manifest, function (val, key) { //3 nested loops = doing it wrong
                outname = outFileName(key, 'dev');
                
                contents = val.map(function (val) {
                    var expand = grunt.file.expand(val);
                    return expand.map(function (f) {
                        var i = f.replace(options.src, options.public);
                        i = codeTemplate(i);
                        return i;
                    }).join('\n');
                }).join('\n');
                
                writeFile(outname, contents);
            });
        };

//TODO: tidy this up, messy.
        //create symlinks for convenience when there is no manifest for a dev version (e.g. sass -> css)
        var buildSymLinks = function () {
            var dest = grunt.file.expand(options.dest + "/*.prod");
            dest.map(function (f) {//TODO: not working well
                //first, need to check for existence. second, need to make sure it folder is sensible
                var prod = f.split("/");
                prod = prod[prod.length - 1];
                var flink = f.replace('prod', 'dev');
                fs.symlinkSync(prod, flink);
            });
        };


        if (hashifyMap) { //production files
            buildProdFile(hashifyMap);
        }
        
        if (options.manifest) { //development files
            buildDevFile(options.manifest);
        }
        else {
            //otherwise, build symlinks that map prod to dev
            buildSymLinks();
        }
    });
};
