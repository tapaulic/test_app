/*
 The main javascript file for test_app.
 IMPORTANT:
 Any resources from this project should be referenced with the relatively to the domain! (ex: /resources/app_name/img/image.png)
 This is because this app's files will exist on an S3 bucket resources/test_app
 BUT the app could be loaded on any page in the WCM.
 */

$(function () {
  //Core uses https://www.npmjs.com/package/gulp-preprocess to allow for preprocessing:
  // @if ENV='local' || ENV='dev'
  console.log('running on env: ', '/* @echo ENV*/');
  // @endif

  let ccAPI = '/*@echo CC.SECURE.INTER.HREF*/' + '/data/my_data_feed';
  let customVar = '/*@echo SOME_ENV*/';
  //See preprocessorOptions() in gulp_helper.js for available variables
  //See https://github.com/jsoverson/preprocess#directive-syntax for more about preprocessor syntax


  //Your app should use this place as the starting point for running code.
  //This file will be loaded on the WCM page near the end of the body, in your footer.html

  //Some things your app might do:
  //Maybe load in some external data with ajax
  //Maybe insert some html into the DOM, referencing elements in body.html
  //Maybe use some corejs features

  //You should use CotModel, which extends Backbone.Model, to manage data models
  let sampleDataObject = new CotModel({
    text_field_name: 'Sample text field value',
    checkbox_field_name: ['one'],
    radio_field_name: 'two',
    postal_code: 'H0H0H0',
    phone: '416-392-0000',
    url: 'http://www.som.com',
    email: 'jkl.jkl@jkl.jkl',
    select_field_name: 'three'
  });

  //You should use CotForm to create forms. The DemoForm class is an example that
  //uses a custom subclass of CotView, which extends Backbone.view, to manage a CotForm instance
  let form = new DemoForm({
    id: 'demo_form',
    title: 'Demo Form',
    model: sampleDataObject
  });

  form.render($('.test_app_container'));
});
