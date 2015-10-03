'use strict';

require.config({
  urlArgs: "bust=" + (new Date()).getTime(),
  baseUrl: '/js',
  paths: {
    jquery: '/libs/js/jquery',
    jqueryui: '/libs/jquery-ui-1.11.4/jquery-ui',
    'jquery-private': '/libs/js/jquery-private'
  /*},
  shim: {
    'jqueryui': {
      exports: '$',
      deps: ['jquery']
    }*/
  },
  map: {
    // '*' means all modules will get 'jquery-private'
    // for their 'jquery' dependency.
    '*': { 'jquery': 'jquery-private' },
    '*': { '$': 'jquery-private' },
    '*': { 'jQuery': 'jquery-private' },

    // 'jquery-private' wants the real jQuery module
    // though. If this line was not here, there would
    // be an unresolvable cyclic dependency.
    'jquery-private': { 'jquery': 'jquery' }
  }
});

require(['jquery', 'jqueryui'], function ($) {
  //DOM elements
  console.log($);

  //variables

  var urlPath = window.location.pathname.replace(/^\/*|\/*$/g, '').split('/');
  console.log(urlPath);
  var url = urlPath[1];

  var source = function (request, response) {
    $.ajax({
      url: '/search-users',
      async: true,
      method: 'POST',
      data: {string: request.term},
      dataType: 'json'
    })
    .then(function (data){
      var usernames = [];
      for (var i = 0, len = data.length; i<len; i++) {
        var username = data[i].username;
        usernames.push({value: username, label: username});
      }
      return response(usernames);
      //return response(data);
    });
  };

  $('#autocomplete').autocomplete({
    source: source,
    appendTo: '#invite-user',
    delay: 600,
    minLength: 3,
    select: function (e, ui) {
      inviteUser(ui.item.value);
      console.log(ui.item.value);
      return false;
    }
  });

  function inviteUser(username) {
    $.ajax({
      url: '/invite-user-to-dit',
      async: true,
      method: 'POST',
      data: {username: username, url: url},
      dataType: 'json'
    })
    .then(function (data){
      console.log(data);
      console.log('finished');
    });
  }

});
