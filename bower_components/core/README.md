# corejs
[![Current Version](https://img.shields.io/badge/version-3.2.1-green.svg)](https://github.com/CityofToronto/corejs)
![node v7](https://img.shields.io/npm/v/@cycle/core.svg)

The WRP-created corejs library for creating City of Toronto web apps.

**A note about forms:**

If you are doing simple web forms, the preferred option is to use IBM Form Experience Builder instead of corejs.

Getting Started
===============
1. Make sure that [npm](https://nodejs.org/en) is installed on your computer. It is best that you have the latest version installed. Otherwise you may run into issues below.
2. Make sure that [git](https://git-scm.com/downloads) is installed on your computer. It is best that you have the latest version installed. Otherwise you may run into issues below.
3. Make sure you are set up to work on on the [city's proxy](docs/cot_proxy_settings.md).
4. Install bower globally by running this on your terminal:<br/>
`npm install -g bower`

5. Install gulp globally by running this on your terminal (optional):<br/>
`npm install gulp -g`

Create a new core-based project
------------------------------------------
1. If you haven't already, clone corejs to your local machine:<br/>
`cd /path_to/your_working_directory && git clone https://github.com/CityofToronto/corejs.git`

2. Pull the latest from master, and install/update the node packages:<br/>
`cd corejs && git checkout master && git pull && npm install && npm update`

3. While in the corejs directory, scaffold a new project. Use the --embedded option for WCM-embedded apps:<br/>
Create a WCM-embedded:<br/>
`gulp scaffold -dir ../name_of_new_app --embedded`<br/>
Create a standalone app:<br/>
`gulp scaffold -dir ../name_of_new_app`

4. Go to your project directory and install the node and bower packages:<br/>
`cd ../name_of_new_app && npm install && bower install`

5. Go back to your terminal and install the bower components:<br/>
`bower install`

6. Update the package.json file with your version, description, authors, etc. and customize the coreConfig settings based on what your project will use.

7. At this point, you should be able to use gulp tasks to build and run your project.
Finish by customizing the bower.json, gulpfile.js, .editorconfig, .env, .gitignore, and readme.md files as you see fit.
You should also probably set up your project with git and send your first commit to a remote. 

Usage
=====
Check out this [table](docs/libraries_loaded.md) for details on what JS/CSS files are loaded for your project.

Standalone apps
---------------
If you are doing a standalone app, use the cot_app class to create your application 'cframe'.
Check out cot_app.js for documentation.
In your package.json, you can set the "includeWebtrends" option to true to get webtrends code injected automatically.
If you do, make sure you also pass the "environment" option to the inject method of gulp_helper.js. 

Using CotForm
-------------
If you are doing a web form, use the CotForm class.
Make sure that your package.json has the core configuration "includeFormValidation" set to true.
Check out cot_forms.js for documentation.

You may also want to use [Backbone](http://backbonejs.org/)-based data modelling.
If so, make sure you have the core configuration option "includeModeling" set to true.
Also check out cot_backbone.js.

You may want to extend your forms with other package.json options:
- "includeEditableSelect": true, //include editableSelect control
- "includePlaceholders": true, //include placeholders shim
- "includeMultiSelect": true, //include multiselect control
- "includeDatePicker": true, //include date picker control
- "includeRangePicker": true, //include date range picker control

Using cot_login
---------------
If you are doing an internal application with user login (via Common Components), use the cot_login class.
Make sure your package.json has the "includeLogin" option set to true. 
See cot_login.js for documentation.

Other configuration options
---------------------------
There are other core configuration options you can specify in your package.json:
- "includeOMS": true, //include [OMS](https://github.com/jawj/OverlappingMarkerSpiderfier) map multi-marker if you are using google maps
- "includeFullCalendar": true, //include full page calendar stuff
- "includeMoment": true, //include [moment.js](http://momentjs.com/) library for date manipulation
- "includeBootbox": true, //include [bootbox](http://bootboxjs.com/) alert control for nice alerts and prompts
- "includeDropzone": true, //include [dropzone](http://www.dropzonejs.com/) function for uploading files
- "includeModal": true, //include the showModal helper method of cot_app/CotApp for modal dialogs 
