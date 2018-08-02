'use strict';

/* Services */

var app = angular.module('ReleaseUI.services', []);

app.factory('Auth', ['$http', '$location', '$rootScope',
  function($http, $location, $rootScope) {
    var provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('repo');

    var service = {
       login: login,
       redirect: redirect,
       logout: logout,
       isLoggedIn: isLoggedIn,
    };
    return service;

    function login() {
      return firebase.auth().signInWithRedirect(provider);
    }
    function redirect() {
      return firebase.auth().getRedirectResult().then(function(result) {
        var token = result.credential.accessToken;
        $http({
            method: 'GET',
            url: 'https://api.github.com/user/teams',
            headers: {'Authorization': 'token ' + token}
        }).then(function successCallback(response) {
            console.log('Successful');
            console.log(response);
        }, function errorCallback(response) {
            console.log(response);
        });
      }).catch(function(error) {
          console.log(error);
      });
    }
    function logout() {
      return firebase.auth().signOut().then(function() {
        console.log('Sign out successful');
      }).catch(function(error) {
        console.log(error);
      });
    }
    function isLoggedIn() {
      return firebase.auth().onAuthStateChanged(function(user) {
       if (user) {
         console.log('Logged In');
         return true;
       } else {
         console.log('Not logged In');
         return false;
       }
      });
    }
}]);

app.service('ReleaseData', function() {
  var release = {};

  var setRelease = function(value) {
      release = value;
  };

  var getRelease = function() {
      return release;
  };

  return {
    setRelease: setRelease,
    getRelease: getRelease
  };
});
