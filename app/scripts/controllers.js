'use strict';

/* Controllers */

var site = window.location.origin;
var auth_org = 'istio-releases';
var auth_team = 'release-ui';
var refresh_time = 900000;

var app = angular.module('ReleaseUI.controllers', ['ngStorage', 'ReleaseUI.filters']);


app.controller('MainController', ['$scope','$http','$location', '$sessionStorage', '$interval',
  function($scope, $http, $location, $sessionStorage, $interval) {

    $scope.auth = localStorage.getItem('auth');

    $scope.logout = function () {
      localStorage.removeItem('loggedIn');
      $location.path('/login');
    };

    // Set static variables
    $scope.user = localStorage.getItem('user');
    $scope.numPerPage = 10;
    $scope.numRequested = 30;

    // Manually set status dropdown
    $scope.stateValues = [
      {"id":1, "status": "No Status"},
      {"id":2, "status": "Abandoned"},
      {"id":3, "status": "Success"},
      {"id":4, "status": "Pending"},
      {"id":5, "status": "Running"},
      {"id":6, "status": "Failed"}
    ];

    // Set default values for storage
    // allows filter options to persist throughout the session
    var defaultStorage = {
      stateValue: null,
      currentPage: 1,
      maxDate: new Date(),
      maxFromDate: new Date(),
      minToDate: new Date(0),
      fromDate: new Date(0),
      toDate: new Date(),
      startDate: null,
      endDate: null,
      whichDate: 'started',
      branchValue: null,
      typeValue: null,
      sortMethod: 5,
      releases: []
    };
    $scope.$storage = $sessionStorage.$default(defaultStorage);

    // Instantiates variables in scope based on stored information
    var setScope = function () {
      $scope.maxDate = new Date($scope.$storage.maxDate);
      $scope.maxFromDate = new Date($scope.$storage.maxFromDate);
      $scope.minToDate = new Date($scope.$storage.minToDate);
      $scope.fromDate = new Date($scope.$storage.fromDate);
      $scope.toDate = new Date($scope.$storage.toDate);
      $scope.filterDate = $scope.$storage.whichDate;

      if ($scope.$storage.startDate != null ) {
        $scope.startDate = new Date($scope.$storage.startDate);
      }
      if ($scope.$storage.endDate != null){
        $scope.endDate = new Date($scope.$storage.endDate);
      }

      $scope.selectedValue = $scope.$storage.stateValue;
      $scope.selectedBranch = $scope.$storage.branchValue;
      $scope.selectedType = $scope.$storage.typeValue;
    };

    // Dynamically populate Branches dropdown from release data
    var getBranches = function () {
      $http({
          method: 'GET',
          url: site + '/branches',
          cache: true
      }).then(function successCallback(response) {
          $scope.branches = angular.fromJson(response.data);
      }, function errorCallback(response) {
          console.log(response);
      });
    };

    // Dynamically populate Types dropdown from release data
    var getTypes = function () {
      $http({
          method: 'GET',
          url: site + '/types',
          cache: true
      }).then(function successCallback(response) {
          $scope.types = angular.fromJson(response.data);
      }, function errorCallback(response) {
          console.log(response);
      });
    };

    // Dynamically populate summary bar for task data
    var getSummary = function () {
      $http({
          method: 'GET',
          url: site + '/overall-status',
          cache: true
      }).then(function successCallback(response) {
          var summary = angular.fromJson(response.data);
          $scope.success = summary['3'];
          $scope.failed = summary['6'];
          $scope.pending = summary['4'] + summary['1'];
          $scope.running_sum = summary['5'];
          $scope.total = summary.total / 100;

      }, function errorCallback(response) {
          console.log(response);
      });
    };

    /**
    * HTTP Request to get release information
    * @param {String} method: specifies why the function is being called
    *                         'page' - page change, 'onload' - refresh,
    *                          anything else is a change in filter/sort
    */
    var getReleases = function (method) {

      // sets state to selected value or default 0 if none are selected
      var state;
      if($scope.$storage.stateValue == null) {
        state = 0;
      }
      else {
        state = $scope.$storage.stateValue;
      }

      // sets time interval for requested releases
      var start = new Date($scope.$storage.fromDate);
      start = Math.floor(start.getTime() / 1000);
      var end = new Date($scope.$storage.toDate);
      end = Math.ceil(end.getTime() / 1000);

      // sets offset depending on why the function is called
      // pagination adds an offset
      // changes in filtering/sorting go back to page 1
      var offset;
      if (method == 'page') {
        offset = $scope.$storage.releases.length;
      }
      else if (method == 'onload') {
        offset = 0;
      }
      else {
        offset = 0;
        $scope.$storage.currentPage = 1;
      }

      // put the sorting into an enum and bool based format, as opposed to a
      // stricly enum format
      var sortMethodDescending;
      if (($scope.$storage.sortMethod % 2) == 1) {
        sortMethodDescending = 1;
      } else {
        sortMethodDescending = 0;
      }
      var sortMethodNum;
      if ($scope.$storage.sortMethod <= 2) {
        sortMethodNum = 1;
      } else if ($scope.$storage.sortMethod <= 4) {
        sortMethodNum = 2;
      } else if ($scope.$storage.sortMethod <= 6) {
        sortMethodNum = 3;
      } else if ($scope.$storage.sortMethod <= 8) {
        sortMethodNum = 4;
      }

      // request url with required parameters
      var url_string = site + '/releases?state=' + state +
          '&branch=' + $scope.$storage.branchValue +
          '&release_type=' + $scope.$storage.typeValue + '&start_date=' + start +
          '&end_date=' + end + '&datetype=' + $scope.$storage.whichDate +
          '&sort_method='+ sortMethodNum + '&limit=' + $scope.numRequested +
          '&offset=' + offset + '&descending=' + sortMethodDescending;

      var mybody = angular.element(document).find('body');
      mybody.addClass('waiting');
      $http({
           method: 'GET',
           url: url_string,
           cache: false
       }).then(function successCallback(response) {
           var data = transform(response.data);
           if (method == 'page') {
             $scope.$storage.releases = $scope.$storage.releases.concat(data);
           }
           else {
             $scope.$storage.releases = data;
           }
           $scope.totalPages = Math.ceil($scope.$storage.releases.length / $scope.numPerPage);
           console.log('request successful');
           mybody.removeClass('waiting');
       }, function errorCallback(response) {
           console.log(response);
           mybody.removeClass('waiting');
       });
    };

    // on reload, gets updated release, type, and branch information
    $scope.reload = function () {
      getReleases('onload');
      getTypes();
      getBranches();
      getSummary();
      setScope();
    };
    $scope.reload();

    //calls reload every 15 minutes
    $interval($scope.reload, refresh_time);

    // onclick/onchange functions that may request more data from server

    /**
    * Change in date selection filters
    * @param {Boolean} from: true if its start date false if end date
    * @param {Date} input: new value taken from datetime input field
    */
    $scope.dateChange = function (from, input) {
      if (from) {
        $scope.$storage.fromDate = input;
        $scope.$storage.minToDate = input;
        $scope.$storage.startDate = input;
      }
      else {
        $scope.$storage.toDate = input;
        $scope.$storage.maxFromDate = input;
        $scope.$storage.endDate = input;
      }
      setScope();
      getReleases('onDateChange');
    };

    /**
    * Change in type of date filter
    * @param {Number} input: 0 if filtering by creation date,
    *                        0 if by last modified
    */
    $scope.dateTypeChange = function (input) {
      if (input == 0) {
        $scope.$storage.whichDate = 'started';
        $scope.$storage.sortMethod = 3;
      }
      else {
        $scope.$storage.whichDate = 'last_modified';
        $scope.$storage.sortMethod = 5;
      }
      setScope();
      getReleases('onDateTypeChange');
    };

    /**
    * Change in dropdown filters
    * @param {Number} type: 0 for state, 1 for branch, 2 for type
    * @param {Date} input: new value taken from dropdown selection
    */
    $scope.filterChange = function (type, input) {
      if (type == 0) {
        $scope.$storage.stateValue = input;
        $scope.$storage.selectedValue = input;
      }
      else if (type == 1) {
        $scope.$storage.branchValue = input;
        $scope.$storage.selectedBranch = input;
      }
      else {
        $scope.$storage.typeValue = input;
        $scope.$storage.selectedType = input;
      }
      setScope();
      getReleases('onFilterChange');
    };

    /**
    * Change in sort method
    * @param {Number} input: 3 for creation date, 5 for last modified, 7 for last task
    */
    $scope.sortChange = function (input) {
      // odd versus even allows for descending and ascending sorts
      if ($scope.$storage.sortMethod % 2 == 0) {
        $scope.$storage.sortMethod = input;
      }
      else {
        $scope.$storage.sortMethod = input + 1;
      }
      getReleases('onSortChange');
    };

    /**
    * Change in sort method
    * @param {Number} input: change in pages
    */
    $scope.pageChange = function (input) {
      // -2 brings user back to first page
      if (input == -2) {
        $scope.$storage.currentPage = 1;
      }
      else if ($scope.$storage.currentPage + input < $scope.totalPages - 1){
        $scope.$storage.currentPage = $scope.$storage.currentPage + input;
      }
      else {
        getReleases('page');
        $scope.$storage.currentPage = $scope.$storage.currentPage + input;
      }
    };

    // Reset filters and sort method
    $scope.resetFilter = function () {
      // Reset default settings and scope
      $sessionStorage.$reset(defaultStorage);
      setScope();

      // Reset dropdowns in UI
      $scope.defaultStatus = true;
      $scope.defaultBranch = true;
      $scope.defaultType = true;
      $scope.startDate = null;
      $scope.endDate = null;

      getReleases('onload');
    };

    // Redirect to Details function onclick of table row
    $scope.redirectToDetails = function (input) {
      var newRoute = '/' + input.release_id;
      $location.path(newRoute);
    };

    $scope.createRelease = function () {
      $location.path('/create-release');
    };
}]);

app.controller('FormController', ['$scope', '$location', '$http', '$compile',
  function ($scope, $location, $http, $compile) {

    $scope.release = {};
    $scope.inputs = 1;

    $scope.logout = function () {
      localStorage.removeItem('loggedIn');
      $location.path('/login');
    };

    $scope.user = localStorage.getItem('user');

    $scope.redirect = function () {
      $location.path('/dashboard');
    };

    $scope.addField = function () {
      $scope.inputs = $scope.inputs + 1;
      var attribute = 'attribute' + String($scope.inputs);
      var value = 'value' + String($scope.inputs);
      var html = '<tr><td>'+
                 '<img class="remove-img" height="25" width="25" src="/app/assets/images/remove.png" ng-click="removeKey($event)">'+
                 '<input ng-model="release.'+ attribute + '" type="text" class="form-control attribute" placeholder="Attribute"></td>'+
                 '<td><input ng-model="release.'+ value + '" type="text" class="form-control" placeholder="Value"></td></tr>';

      var ele = document.getElementById('table-body');
      angular.element(ele).append($compile(html)($scope));
    };

    $scope.removeKey = function (e) {
      console.log('removed attribute');
      $(e.target).parent().parent().remove();
    };

    $scope.submit = function () {
      var release_dict = {};
      var keys = Object.keys($scope.release);
      for (var i = 0; i < keys.length; i += 2) {
        var key1 = keys[i];
        var key2 = keys[i+1];
        var attribute = $scope.release[key1];
        var value = $scope.release[key2];
        release_dict[attribute] = value;
      }
      console.log(release_dict);
    };

    $scope.cancel = function () {
      $location.path('/dashboard');
    };
}]);

app.controller('DetailsController', ['$scope', '$location', '$http', '$routeParams', '$sessionStorage',
  function ($scope, $location, $http, $routeParams, $sessionStorage) {

    $scope.auth = localStorage.getItem('auth');
    $scope.user = localStorage.getItem('user');

    $scope.createRelease = function () {
      $location.path('/create-release');
    };

    $scope.logout = function () {
      localStorage.removeItem('loggedIn');
      $location.path('/login');
    };


    // on click of nav bar returns user to main dashboard
    $scope.redirect = function () {
      $location.path('/dashboard');
    };

    var release_id = $routeParams.release_id;

    var mybody = angular.element(document).find('body');
    mybody.addClass('waiting');
    // Request release details
    $http({
         method: 'GET',
         url: site + '/release?release=' + release_id,
         cache: true
     }).then(function successCallback(response) {
         $scope.release = angular.fromJson(response.data);
     }, function errorCallback(response) {
         console.log(response);
     });

    // Request task details
    $http({
         method: 'GET',
         url: site + '/tasks?release=' + release_id,
         cache: true
     }).then(function successCallback(response) {
          $scope.tasks = transform(response.data);
          mybody.removeClass('waiting');
     }, function errorCallback(response) {
         console.log(response);
         mybody.removeClass('waiting');
     });

     $scope.redirect = function () {
       $location.path('/dashboard');
     };

     $scope.getLogs = function (task) {
       var newRoute = '/' + release_id + '/' + task.task_name + '/logs'
       $location.path(newRoute);
     };
}]);

app.controller('LogsController', ['$scope', '$http', '$routeParams', '$sce',
  function($scope, $http, $routeParams, $sce){

    var release = $routeParams.release_id;
    var task = $routeParams.task_name;

    $http({
         method: 'GET',
         url: site + '/logs?release_id=' + release + '&task_name=' + task,
         cache: true
     }).then(function successCallback(response) {
         var text = angular.fromJson(response.data);
         text = '<p align="left">' + text.replace(/\n/gm, '<br>') + '</p>';
         $scope.html = $sce.trustAsHtml(text);
     }, function errorCallback(response) {
         console.log(response);
     });

}]);

app.controller('LoginController', ['$scope', '$location', '$http',
  function($scope, $location, $http){
    var loggingIn;

    var provider = new firebase.auth.GithubAuthProvider();
    provider.addScope('repo');

    if (localStorage.getItem('loggedIn')) {
      $scope.login_message = 'Go to Dashboard';
    }
    else if (localStorage.getItem('loggingIn')) {
      $scope.login_message = 'Log In with GitHub';
      localStorage.removeItem('loggingIn');
      $scope.isLoading = true;
      firebase.auth().getRedirectResult().then(function(result) {
        var token = result.credential.accessToken;
        $http({
            method: 'GET',
            url: 'https://api.github.com/user/teams',
            headers: {'Authorization': 'token ' + token}
        }).then(function successCallback(response) {
             var teams = response.data;
             localStorage.setItem('loggedIn', true);
             localStorage.setItem('user', result.user.displayName);
             $location.path('/dashboard');

            // Code for more stringent authentication (specific org and team)
            // var auth = false;
            // for (var key in teams) {
            //  if (teams.hasOwnProperty(key)){
            //    var name = teams[key].name;
            //    var org = teams[key].organization.login;
            //
            //    if (name == auth_team && org == auth_org){
            //      auth = true;
            //      console.log('loggedin');
            //      localStorage.setItem('loggedIn', true);
            //      localStorage.setItem('user', result.user.displayName);
            //      $location.path('/dashboard');
            //    }
            //  }
            // }
            // if(!auth){
            //   alert("You are not authorized to view this page.");
            // }
            $scope.isLoading = false;
        }, function errorCallback(response) {
          $scope.isLoading = false;
          console.log(response);
        });
      }).catch(function(error) {
        $scope.isLoading = false;
        console.log(error);
      });
    }
    else {
      $scope.login_message = 'Log In with GitHub';
      localStorage.removeItem('user');
      localStorage.removeItem('auth');
      firebase.auth().signOut().then(function() {
        console.log('Sign out successful');
      }).catch(function(error) {
        console.log(error);
      });
    }

    $scope.login = function () {
      if (localStorage.getItem('loggedIn')){
        $location.path('/dashboard');
      }
      else {
        localStorage.setItem('loggingIn', true);
        firebase.auth().signInWithRedirect(provider);
      }
    };
}]);

var transform =
  /**
  * Transforms json object to array
  * @param {Object} input
  * @return {Array}
  */
  function (input) {
  input = angular.fromJson(input);
  var output = [];

  angular.forEach(input, function(item) {
    output.push(item);
  });
   return output;
};
