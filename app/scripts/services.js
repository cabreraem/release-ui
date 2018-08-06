'use strict';

/* Services */

var auth_org = 'istio-releases';
var auth_team = 'release-ui';

var app = angular.module('ReleaseUI.services', []);

app.factory('Auth', ['$http', '$location', '$rootScope',
  function($http, $location, $rootScope) {
    var provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('repo');
    var user;
    var token;

    var service = {
       login: login,
       logout: logout,
       login: login,
       isAuthenticated: isAuthenticated
    };
    return service;

    function login(input) {
      token = input;
    }

    function logout() {
      user = null;
      return firebase.auth().signOut().then(function() {
        console.log('Sign out successful');
      }).catch(function(error) {
        console.log(error);
      });
    }
    function isAuthenticated() {
      return $http({
          method: 'GET',
          url: 'https://api.github.com/user/teams',
          headers: {'Authorization': 'token ' + token}
      }).then(function successCallback(response) {
          var teams = response.data;
          for (var key in teams) {
           if (teams.hasOwnProperty(key)){
             var name = teams[key].name;
             var org = teams[key].organization.login;

             if (name == auth_team && org == auth_org){
               console.log('Authenticated');
               return true;
             }
           }
          }
          return false;
      }, function errorCallback(response) {
          console.log(response);
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
