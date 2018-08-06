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
        // logged user, redirect to /dashboard
        if (next.templateUrl === "app/partials/login.html") {
          $location.path('dashboard');
        }
        Auth.isAuthenticated().then((result) => {
          if ( next.templateUrl === "app/partials/create-release.html") {
            $location.path("/dashboard");
          }
        });
      }
      else {
        // no logged user, redirect to /login
        if ( next.templateUrl === "app/partials/login.html") {
        } else {
          $location.path("/login");
        }
      }
    });
  });
});
