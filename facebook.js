(function(window, $) {
  // old_open = window.open;
  //
  // openWindows = []
  //
  // window.open = function(){
  //
  // openWindows.push(old_open.apply(window,arguments));
  //
  // }
  var initPromise,
    TIMEOUT = 5000,
    FACEBOOK_UNREACHABLE_MESSAGE  = 'Sorry, we were unable to connect to Facebook',
    OPTIONS = {
      timeout: TIMEOUT,
      message: FACEBOOK_UNREACHABLE_MESSAGE
  };

  window.Facebook = Facebook = {
    init: init,
    login: login,
    logout: logout,
    user: user,
    currentUser: currentUser,
    currentStatus: currentStatus,
  };

  function promise(options) {
    var deferred = $.Deferred(),
    timeout, fn, message, pid;

    if ( $.isNumeric(options) ) {
      timeout = options;
      message = 'TIMEOUT';
      fn = arguments[1];

    } else if ( $.isPlainObject(options) ) {
      timeout = options.timeout;
      message = options.message;
      fn = arguments[1];

    } else  if ( $.isFunction(options) ) {
      fn = options;

    } else {
      throw new Error('Invalid Input');
    }

    if (timeout) {
      pid = setTimeout(function() {
        deferred.reject(message);
      }, timeout);

      deferred.done(function() {
       clearTimeout(pid);
      });
    }

    fn(deferred);

    return deferred.promise();
  }

  function init() {
    if (initPromise) { return initPromise; }

    return (initPromise = promise(OPTIONS, function(deferred) {

      window.fbAsyncInit = function() {
        console.log('init');
        FB.init({
          appId: window.FACEBOOK_APP_ID,
          channelUrl: '//' + window.location.hostname + '/channel.html',
          status: true,
          cookie: true,
          oauth: true,
        });

        deferred.resolve();
      };

      (function(d) {
        var id, js;
        id = 'facebook-jssdk';
        if (d.getElementById(id)) { return; }
        js = d.createElement('script');
        js.id = id;
        js.async = true;
        js.src = "//connect.facebook.net/en_US/all/debug.js";
        js.type = "text/javascript";
        d.getElementsByTagName('head')[0].appendChild(js);
      }(document));
    }));
  }

  function user(id) {
    return promise(OPTIONS, function(deferred) {
      FB.api('/' + id, function(data) {
        if (data.error){
          deferred.reject(data);
        } else {
          deferred.resolve(data)
        }
      });
    });
  }

  function userFromStatus (statusResponse) {
    return Facebook.user(statusResponse.userID);
  }

  function login (){
    return promise(OPTIONS, function(deferred) {
      function attemptFacebookLogin() {
        FB.login(function(response) {
          if (response.status === 'connected') {
            window.authResponse = response.authResponse;

            Facebook.
              user(response.authResponse.userID).
              then(deferred.resolve, deferred.reject)

          } else {
            deferred.reject(UNABLE_TO_CONNECT)
          }
        });

      }

      return Facebook.init().then(attemptFacebookLogin, deferred.reject);
    });
  }

  function logout() {
    return promise(function(deferred) {
      function attemptFacebookLogout() {
        FB.logout(deferred.resolve);
      }

      return Facebook.init().then(attemptFacebookLogout, deferred.reject);
    });
  }

  function currentUser() {
    return Facebook.currentStatus().then(userFromStatus);
  }

  function currentStatus() {
    return promise(OPTIONS, function(deferred) {
      function getStatus() {
        FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            window.authResponse = response.authResponse;
            deferred.resolve(response.authResponse);
          } else {
            deferred.reject(response.authResponse);
          }
        });
      }

      Facebook.init().then(getStatus, deferred.reject);
    });
  }

}(this, $));
