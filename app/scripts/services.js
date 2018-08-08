'use strict';

/* Services */

var app = angular.module('ReleaseUI.services', [])
                 .constant('auth_org', 'istio-release-ui')
                 .constant('auth_team', 'release-ui');

app.factory('Auth', ['$http', 'auth_org', 'auth_team',
  function($http, auth_org, auth_team) {
    var provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('repo');
    var user;
    var token;
    var credential;

    var service = {
       login: login,
       logout: logout,
       getUser: getUser,
       login: login,
       isAuthenticated: isAuthenticated
    };
    return service;

    function login(t, u, c) {
      token = t;
      user = u;
      credential = c;
    }

    function logout() {
      user = null;
      token = null;
      credential = null;
      return firebase.auth().signOut().then(function() {
        console.log('Sign out successful');
      }).catch(function(error) {
        console.log(error);
      });
    }

    function getUser () {
      return user;
    }

    function isAuthenticated() {
      if (token) {
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
      else {
        return false;
      }

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
