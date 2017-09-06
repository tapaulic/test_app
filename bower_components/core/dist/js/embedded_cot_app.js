var CotApp = function () {
  this.appContentKeySuffix = '/';
};

CotApp.prototype.loadAppContent = function (o) {
  var data = {},
    options = $.extend({
      keys: [], //an array of titles of API Content Snippets from WP
      tag: '', //a future option, where you can get multiple snippets with a single tag
      onComplete: function (data) { //called after all API calls are completed
        //data - a key/value hash with each key name and the associated fetched data value
      },
      onProgress: function (keyName, errXhr, errMsgOne, errMsgTwo) { //called after a single key is loaded successfully or not successfully
        //keyName - the key that was just finished
        //errXhr, errMsgOne, errMsgTwo - error information if the API call failed
      }
    }, o),
    this1 = this;

  if (options.tag) {
    //TODO: grab all content for a given tag
  } else {
    var count = 0;
    options.keys.forEach(function (key) {
      $.ajax({
        url: '/app_content/' + key + this1.appContentKeySuffix,
        success: function (result) {
          data[key] = result;
          options.onProgress(key);
        },
        error: function (a, b, c) {
          options.onProgress(key, a, b, c);
        },
        complete: function () {
          count++;
          if (count >= options.keys.length) {
            options.onComplete(data);
          }
        }
      });
    });
    if (options.keys.length === 0) {
      options.onComplete(data);
    }
  }

};

CotApp.prototype.showTerms = function (o) {
  var options = $.extend({
    termsText: 'Content missing: terms text', //The body text of the terms and conditions
    disagreedText: 'Content missing: terms disagreed text', //The body text to show when someone disagrees with the terms and conditions
    agreedCookieName: 'terms_cookie' + Math.random().toString().split('.')[1], //The name of the cookie to store the user's agreement in
    containerSelector: '', //A CSS selector for an element on screen where the terms and conditions will be shown
    onAgreed: function (termsWereShown) { //A function called after the user clicks the agree button
      //termsWereShown - true if the terms were shown before agreement. false if the user had previously agreed and the cookie was still there, bypassing the terms
    },
    onDisagreed: function () { //A function called after the user clicks the disagree button
    },
    agreementTitle: 'Terms of Use Agreement' //The title to show at the top
  }, o);

  if (!options.containerSelector) {
    throw new Error('missing container selector for CotApp#showTerms');
  }

  if ($.cookie(options.agreedCookieName) !== "agree") {
    var this1 = this;
    $(options.containerSelector).html('<section id="cot-terms">' +
      '<div id="cot-terms-title"><h2>' + options.agreementTitle + '</h2></div>' +
      '<div class="row">' +
      '<article class="media col-xs-12">' +
      '<div id="cot-terms-body">' + options.termsText + '</div>' +
      '<div class="btn-toolbar">' +
      '<div class="btn-group"><button id="cot-terms-agree" class="btn btn-primary" type="button">Agree</button></div>' +
      '<div class="btn-group"><button id="cot-terms-disagree" class="btn btn-primary" type="button">Disagree</button></div>' +
      '</div>' +
      '</article>' +
      '</div>' +
      '</section>');

    $("#cot-terms-agree").click(function () {
      $.cookie(options.agreedCookieName, 'agree');
      $('#cot-terms').remove();
      options.onAgreed(true);
    });

    $("#cot-terms-disagree").click(function () {
      $('#cot-terms').remove();
      $(options.containerSelector).html('<section id="cot-terms">' +
        '<div id="cot-terms-title"><h2>Unable to Proceed</h2></div>' +
        '<div class="row">' +
        '<article class="media col-xs-12">' +
        '<div id="cot-terms-body">' + options.disagreedText + '</div>' +
        '<div class="buttons">' +
        '<button id="cot-terms-return" class="btn btn-primary" type="button">Terms and Conditions</button>' +
        '</div>' +
        '</article>' +
        '</div>' +
        '</section>');
      $("#cot-terms-return").click(function () {
        $('#cot-terms').remove();
        this1.showTerms(options);
        $('#cot-terms-agree').focus();
      }).focus();
      options.onDisagreed();
    });
  } else {
    options.onAgreed(false);
  }
};
