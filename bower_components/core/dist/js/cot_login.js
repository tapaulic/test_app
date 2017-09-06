var cot_login_app;

var cot_login = function(options) {
  this.options = $.extend({
    appName: '', //Required, the name of your app, this will be sent to the CC AuthSession API call to login
    ccRoot: '', //Optional, defaults to '' (the current protocol and domain will be used), use this to specify the <protocol>:://<domain> to use for the CC AuthSession API call
    welcomeSelector: '', //Optional, a jquery selector string for the element where the login/logout information should be displayed
    onReady: function(cot_login_instance){}, //Optional, a function that will be called after this cot_login object is ready to be used
    onLogin: function(cot_login_instance){}, //Optional, a function that will be called after the user logs in successfully
  },options || {});

    if (!this.options['appName']) {
        throw new Error('Error: the appName option is required');
    }

  this.session = new CotSession({
    appName: this.options['appName'],
    ccApiOrigin: this.options['ccRoot']
  });

    var that = this,
        modal = null;
    $("#app-utility-login").load('html/cot_login.html? #loginModal', function() {
        that.modal = $("#loginModal");

        that.modal.find("#cot_login").click(function() {
            that._login();
        });

        that.modal.find('input').keydown(function(e) {
            if ((e.charCode || e.keyCode || 0) === 13) {
                that._login();
            }
        });
        that._setUserName();

        that.options['onReady'](that);
    });
};


cot_login.prototype.showLogin = function() {
    this.modal.modal();
};

cot_login.prototype.isLoggedIn = function() {
    return this.session.isLoggedIn();
};

cot_login.prototype.logout = function() {
  this.session.logout();
    this._setUserName();
    window.location.reload();
};

cot_login.prototype._setUserName = function() {
  this._loadSessionFields();
    cot_login_app = this;

    if (this.isLoggedIn()) {
        // User is logged in - display login name
        $(this.options['welcomeSelector']).html("<div class='welcomemsg'><b>User Name</b>: " + this.username + " (<a class='logout' onclick='cot_login_app.logout();'>Logout</a>)</div>");

        // Call the success callback function that is called when a user is logged
        this.options['onLogin'](this);

    } else {
        // User is not logged in - display login link
        $(this.options['welcomeSelector']).html("<div class='welcomemsg'><a class='login' onclick='cot_login_app.showLogin();'>Login</a></div>");
    }
};

cot_login.prototype._login = function() {
    var that = this;

    this.modal.find(".btn").prop('disabled', true);

    this.session.login({
      username: $("#username").val(),
      password: $("#password").val(),
      success: function(){
        that._setUserName();
        that.modal.modal('hide');
      },
      error: function(jqXHR, textStatus, error) {
        console.log("POST Request Failed: " + textStatus + ", " + error,  arguments);
        if (error === 'invalid_user_or_pwd') {
          that._displayLoginError(textStatus);
        } else {
          that._displayLoginError('Unable to log in. Please try again.');
        }
      },
      always: function() {
        that.modal.find(".btn").removeAttr('disabled').removeClass('disabled');
      }
    });
};

cot_login.prototype._loadSessionFields = function() {
  var that = this;
  ['sid', 'username', 'email', 'firstName', 'lastName', 'division', 'groups'].forEach(function(fld){
    that[fld] = that.session[fld];
  });
};

cot_login.prototype._displayLoginError = function(s) {
    $('<div class="alert alert-danger" role="alert">' + s + '</div>')
        .prependTo(this.modal.find("#loginModalBody"))
        .fadeOut(5000, function () {
            $(this).remove();
        });
};

var CotSession = function(options) {
  this.options = $.extend({
    appName: '', //Required, the name of your app, this will be sent to the CC AuthSession API call to login
    ccApiOrigin: '', //By default, login happens on the same origin as the current page. You could override this with, for example, https://was-inter-sit.toronto.ca
    ccApiPath: '/cc_sr_admin_v1/' //If needed, you could use a different API path
  },options || {});

  if (!this.options['appName']) {
    throw new Error('Error: the appName option is required');
  }
  this._loadSessionFromCookie();
};
CotSession.LOGIN_CHECK_RESULT_TRUE = 1;
CotSession.LOGIN_CHECK_RESULT_FALSE = 2;
CotSession.LOGIN_CHECK_RESULT_INDETERMINATE = 3;
CotSession.prototype.isLoggedIn = function(serverCheckCallback) {
  //specify serverCheckCallback as a callback function if you want to test the session on the server
  //serverCheckCallback will receive an argument equal to one of the following:
  // CotSession.LOGIN_CHECK_RESULT_TRUE //the user's session is still valid
  // CotSession.LOGIN_CHECK_RESULT_FALSE //the user's session is not valid
  // CotSession.LOGIN_CHECK_RESULT_INDETERMINATE //the user's session could not be tested due to server or network issues

  //if serverCheckCallback is not specified, only the local cookie is checked
  if (!serverCheckCallback) {
    if (this._cookie('sid')) {
      return true;
    } else {
      this.logout();
      return false;
    }
  } else {
    var sid = this.sid || this._cookie('sid');
    if (!sid) {
      serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
    } else {
      var url = this.options.ccApiOrigin + this.options.ccApiPath + 'session/' + sid;
      var that = this;
      $.get(url, function(data) {
        var app = data['app'] || '',
          rsid = data['sid'] || '',
          error = data['error'] || '';
        if (app === that.options.appName && rsid === sid) {
          that._storeLogin(data);
          serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_TRUE);
        } else if (error === 'no_such_session') {
          that.logout();
          serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_FALSE);
        } else {
          serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
        }
      }).fail(function(jqXHR, textStatus, error) {
        console.log('Unable to test session. jqXHR:', jqXHR, 'textStatus:', textStatus, 'error:', error);
        serverCheckCallback(CotSession.LOGIN_CHECK_RESULT_INDETERMINATE);
      });
    }
  }
};

CotSession.prototype.login = function(options){
  options = $.extend({
    username: '', //the username to login with
    password: '', //the password to login with
    success: function(){}, //a function to call after a successful login
    error: function(jqXHR, textStatus, error){}, //a function to call after an unsuccessful login
    always: function(){} //a function to always call after the whole login attempt is complete
  },options || {});

  var url = this.options.ccApiOrigin + this.options.ccApiPath + 'session?app=' + this.options.appName;
  var payload = {
    user: options.username,
    pwd: options.password
  };
  var that = this;
  $.post(url, payload, function(data) {
    if (!data['error']) {
      that._storeLogin(data);
      options.success();
    } else if (data.error === 'invalid_user_or_pwd') {
      options.error(null,'Invalid username or password', data.error);
    }
  }).fail(function(jqXHR, textStatus, error) {
    options.error(jqXHR, textStatus, error);
  }).always(function() {
    options.always();
  });
};

CotSession.prototype.logout = function () {
  this._removeCookie('sid');
  this._removeCookie('cot_uname');
  this._removeCookie('email');
  this._removeCookie('firstName');
  this._removeCookie('lastName');
  this._removeCookie('division');
  this._removeCookie('groups');
  this._loadSessionFromCookie();
};

CotSession.prototype.extend = function(minutes) {
  //set how long the current session cookies should last before expiring, in minutes
  //if omitted, the session will be set to expire in the default 30 minutes
  //returns true if the session cookie expiry times were updated, false if not (because there is no session data)

  //NOTE: not entirely sure what should happen if the current session cookies are expired...
  if (this.sid) {
    this._storeLogin({
      passwordExpiryDate: minutes ? (new Date()).getTime() + (minutes * 60 * 1000) : null,
      sid: this.sid,
      userID: this.username || '',
      email: this.email || '',
      cotUser: {
        firstName: this.firstName || '',
        lastName: this.lastName || '',
        division: this.division || '',
        groupMemberships: this.groups || ''
      }
    });
    return true;
  }
  return false;
};

CotSession.prototype._loadSessionFromCookie = function() {
  this.sid = this._cookie('sid') || '';
  this.username = this._cookie('cot_uname') || '';
  this.email = this._cookie('email') || '';
  this.firstName = this._cookie('firstName') || '';
  this.lastName = this._cookie('lastName') || '';
  this.division = this._cookie('division') || '';
  this.groups = this._cookie('groups') || '';
};

CotSession.prototype._storeLogin = function(data) {
  var date = new Date();
  // Cookie session timeout to password expiry time from AuthSession API otherwise set to 1 hour
  if (data['passwordExpiryDate']) {
    date.setTime(data['passwordExpiryDate']);
  } else {
    date.setTime(date.getTime() + (30 * 60 * 1000));
  }
  this._cookie("sid", data.sid, {expires: date});
  this._cookie("cot_uname", data['userID'], {expires: date});
  this._cookie("email", (data['email'] || '').toLowerCase(), {expires: date});
  if (data['cotUser']) {
    this._cookie("firstName", data['cotUser']['firstName'], {expires: date});
    this._cookie("lastName", data['cotUser']['lastName'], {expires: date});
    this._cookie("division", data['cotUser']['division'], {expires: date});
    this._cookie("groups", data['cotUser']['groupMemberships'], {expires: date});
  }
  this._loadSessionFromCookie();
};

CotSession.prototype._cookie = function(key, value, options){
  if(key) {
    key = encodeURIComponent(this.options.appName) + '.' + key;
  }
  return $.cookie(key, value, options);
};

CotSession.prototype._removeCookie = function(s){
  return $.removeCookie(encodeURIComponent(this.options.appName) + '.' + s);
};
