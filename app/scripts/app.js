'use strict';

var app = angular.module('ReleaseUI', ['ReleaseUI.controllers', 'ReleaseUI.services', 'ngRoute', 'ngResource', 'ngMaterial']);


app.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/dashboard', {
      templateUrl: 'app/partials/main.html',
      controller: 'MainController'
    })
    .when('/login', {
      templateUrl: 'app/partials/login.html',
      controller: 'LoginController'
    })
    .when('/create-release', {
      templateUrl: 'app/partials/create-release.html',
      controller: 'FormController'
    })
    .when('/:release_id', {
      templateUrl: 'app/partials/details.html',
      controller: 'DetailsController'
    })
    .when('/:release_id/:task_name/logs', {
      templateUrl: 'app/partials/logs.html',
      controller: 'LogsController'
    })
    .otherwise({
      redirectTo: '/dashboard'
    });
}).run(function($rootScope, $location, Auth) {
  $rootScope.$on("$routeChangeStart", function(event, next, current) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // logged user, redirect to /dashboard when /login requested
        if (next.templateUrl === "app/partials/login.html") {
          event.preventDefault();
          $location.path('/dashboard');
        }
        //check if authenticated for /create-release
        if (next.templateUrl === "app/partials/create-release.html") {
          Auth.isAuthenticated.then((result) => {
            if (result) {
            }
            else {
              event.preventDefault();
              $location.path('/dashboard');
            }
          })
        }
      }
      else {
        // no logged user, redirect to /login
        event.preventDefault();
        $location.path("/login");
      }
    });
  });
});
