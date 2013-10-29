Asset Handler
============

Asset Handler is a self-contained way to manage UI assets (CSS, JavaScript, images and favicons) across different frameworks

## Getting Started

### Pre-install
You need [Grunt `~0.4.0`](http://gruntjs.com/), which itself needs node and npm.

Some tasks have non-npm dependencies.  These are:
 * PhantomJS for Jasmine tests (`brew install phantomjs`)
 * ImageMagick for favicon creation (`brew install imagemagick`)
 * Ruby for SASS (there is an npm module for sass, but it isn't as good)
 * Optionally: Growl, Notification Centre, Snarl or Notify-Send for noisy warnings when a task fails.


## How it works

Current asset handlers like Sprockets / Rails asset pipeline / mincer are all tightly bound to the framework they exist on (Ruby / Rails 3.1+ / Node).  These particular examples mount an environment, create a virtual file system using a load path to specify the asset folders and then provide logical paths to the files within, depending on how they were specified in the load path.  There is no way to do that without tying the application tier to the presentation tier.

This creates a dependence on a particular application framework, which then impacts decisions about the application that really should not be affected by the presentation tier.

The asset handler uses 2 config files to allow the developer to specify the locations for the source files and their destinations, Grunt to handle file processing, and outputs simple text files that get used as includes within your site instead of directly referencing the file in the static assets directory.  For each asset include, there is a 'dev' version and a 'prod' version.

The asset handler has been built so that you just need to set up a grunt-folder.json file and a jsmanifest.json file, the Grunt file itself should (hopefully) not need changed.

**Destination folders for images, CSS and JS get wiped clean when grunt is started.  Don't save files directly in your destination folders. **

### Configure your site
Update grunt-folders.json with directory information for where your assets sit and where they should get output to (more help below)

Create a jsmanifest.json file in your JavaScript asset folder (more help below)

Set up your html templates to pull in the generated includes dependent on environment (more help below)

Run `npm install`

Run `grunt` for development environment

Run `grunt build` for test &amp; production environment


### Development mode
Running `grunt` will
+ clean out the destination folders
+ run sass task to create css files from scss
+ run images task to optimise jpegs and gifs and copy across pngs
+ run favicon task to produce the various favicon variations and create the html that should be included in the head
+ create a minified version of the CSS in the destination folder
+ add a MD5 hash fingerprint to the minified CSS files' filename for versioning
+ copy the JS files from the source location to the destination location
+ create the include files for CSS and JS locations for use in the HTML templates
+ run lint tools over the source folders for CSS and JS
+ watch for changes to the source folders to automatically run processing and test tasks on them when they change

### Test / production mode
Running `grunt build` will
+ clean out the destination folders
+ run sass task to create css files from scss
+ run images task to optimise jpegs and gifs and copy across pngs
+ run favicon task to produce the various favicon variations and create the html that should be included in the head
+ create minified, concatenated versions of CSS and JS files in the destination folder
+ run lint tools and unit test tools over the CSS and JS
+ add a MD5 hash fingerprint to the minified CSS files' and JS files' filename for versioning
+ create the include files for CSS and JS locations for inclusion in the HTML templates


###Notes
CSS concatenation is handled by SASS.  CSS minification is handled by CSSMin.  This occurs in both development and test/production environments.
The dev includes for CSS are actually just symlinks to prod includes.

JavaScript concatenation and minification is handled by uglify.  This only occurs on build for test/production, so that the development environment has seperate files for debugging.

PNGs are not run through the image optimiser because the quality of the output was unreliable.

Jasmine test files are expected to end with Spec.js, and their helpers should be saved in the same folder and end with Helper.js

###Watched processes
If you update the scss files, cleanup of the source css files and css include files, the SASS task to convert them to CSS, CSS Lint, minification, versioning, and asset include file update tasks are run

If you change your js source files, js hint, jasmine tests, jasmine coverage, and copy js tasks are run 

If you add or change an image, imagemin, and copy png tasks are run

If you delete an image, a delete file process is run on the destination

If you change your favicon source, the favicon task is run

If you update your jsmanifest.json file, cleanup of the js include files and the task to update the asset include files is run

## Grunt-folders.json
This file is where you specify where your assets' sources are (src), where they should be built to (dest), and where any supplementary output should be created (out), and the output redirect path (e.g. you may have a /public folder which is mapped to / on your server).

**Paths are relative to the location of Gruntfile.js**

This example shows a Ruby on Rails site setup.

**Your src, dest and out locations do not have to match the locations below, it is an example.**

**Your src, dest and out folders must not be in the same place.  Destination and output get cleaned at certain points to ensure that they don't fill up with deleted or renamed files **

In this example the rails site is in a web/ subfolder, with static assets in public being routed to root.
* Source files are saved in app/assets/
* Files that get used in the site are output to public/
* Test files are saved in test/javascript
* Coverage output sits at the same level as the grunt file in jasmine-coverage
* Supplementary files are saved to views/shared/
* For CSS and JS, the supplementary files are the production and development includes
* For images, the supplementary file is the HTML produced by favicon that should be output in the `<head>`
* The favicon source is at the same level as the grunt file and the various files it produces are output to an ico subdirectory of images


````javascript
{
    "output_redirect_path": ["web/public", "/"],
    "js": {
      "src": "web/app/assets/javascripts",
      "dest": "web/public/js",
      "out": "web/app/views/shared/javascripts"      
    },
    "css": {
      "src": "web/app/assets/stylesheets",
      "dest": "web/public/css",
      "out": "web/app/views/shared/stylesheets"
    },
    "img": {
      "src": "web/app/assets/images",
      "dest": "web/public/images",
      "out": "web/app/views/shared/images",
      "icons": {
        "src": "icon.png",
        "dest": "web/public/images/ico"
      }
    },
    "spec": {
      "src": "web/test/javascript",
      "coverage": "jasmine-coverage"
    }
}

````

## jsmanifest.json

This file specifies how you want to organise your JS files.

It is used by uglify to concatenate the right files into the right individual minified files.  It is passed through to writeconfig to create the dev includes properly.

Globbing allows you to specify a folder and subfolders.

In this example, you will end up with 4 files: main.dev, main.prod, special.dev, special.prod


````javascript
{
    "main": [
        "web/app/assets/javascripts/main.js",
        "web/app/assets/javascripts/additional.js",
        "web/app/assets/javascripts/subfolder/**/*.js"
    ],
    "special": [
        "web/app/assets/javascripts/special.js"
    ]
}

````

Output web/app/views/layouts/javascripts/main.dev
````html
<script src="/js/main.js"></script>
<script src="/js/additional.js"></script>
<script src="/js/subfolder/nest2/nest2.js"></script>
<script src="/js/subfolder/subfile.js"></script>
````

Output web/app/views/layouts/javascripts/special.dev
````html
<script src="/js/special.js"></script>
````

Output web/app/views/layouts/javascripts/main.prod
````html
<script src="/js/main.b9515bc220576cc25ab14bd278cca9c5.min.js"></script>
````

Output web/app/views/layouts/javascripts/special.prod
````html
<script src="/js/special.ae9ee2d3e61057ca33b0688efb041939.min.js"></script>
````

## HTML Templates Integration

For integration with your HTML templates, you need to set up a variable based on the environment that outputs 'dev' for development environment and 'prod' for test and production.  This will be used to pull in the correct include.

**Rails example**
````ruby
in settings
 <%
  envformat = Rails.env == "development" ? "dev" : "prod"
  %>

in application.html.erb
  <%= render :file => 'layouts/javascripts/main', :formats => [:"#{envformat}"] %>
````
