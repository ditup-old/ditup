'use strict';

require.config({
  urlArgs: "bust=" + (new Date()).getTime(),
  baseUrl: '/js',
  paths: {
    jquery: '/libs/js/jquery',
    jqueryui: '/libs/jquery-ui-1.11.4/jquery-ui',
    'jquery-private': '/libs/js/jquery-private',
    socketio: '/socket.io/socket.io'
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

require(['talk/NewTalk','users/User', 'jquery', 'socketio', 'jqueryui'], function (NewTalk, User, $, io) {

//DOM elements
//  var $chat = $('#chat');
//  var $sendMessage = $('#send-message');
//  var $message = $('#message');
//  var $newTalkFormWrap = $('#new-talk-form-wrap');

  /* connecting dom objects to talk form*/
  var newTalk = new NewTalk({
    dom: {
      main: $('#new-talk-div'),
      form: $('#new-talk-form'),
      userList: $('#user-list')
    },
    submit: function (data) {
      return sendForm(data);
    }
  });
//  var $newTalkMsg = $('#new-talk-msg');
//  var $newTalkButton = $('#new-talk-button');
//  var $talkList = $('#talk-list');
  var $newTalkButton = $('#new-talk-button');

  $newTalkButton.on('click', function () {
    newTalk.toggle();
  });

  var me = {logged: false, username: 'guest'};


//****************incoming socket
  var socket = io(':3000/talk-io');
  //var socket = io();

  socket.on('connect', function () {
    //$chat.append('connected to the server<br />');
  });

  socket.on('auth', function (sess) {
    console.log('auth', sess);
    /*
    var msgLogged = 'you are logged in as ' + sess.username + '.';
    var msgNotLogged = 'you are not logged in.'
    var msg = sess.logged === true ? msgLogged : msgNotLogged;
    $chat.append(msg + '<br />');
    me = {logged: sess.logged, username: sess.username || me.username}*/
  });
  
  socket.on('new-connection', function (user) {
    var msg = 'you ' + user.username + ' connected from different place. altogether it\'s '+user.connectno+' connections.';
    $chat.append(msg + '<br />');
  });

  socket.on('talk-list', function (talks){
    console.log('talks', talks);
  });

  socket.on('disconnect', function () {
    //$chat.append('disconnected from the server<br />');
  });

  function sendForm(data) {
    socket.emit('new-talk', data);
  }


  //DOM elements
  //variables

  var urlPath = window.location.pathname.replace(/^\/*|\/*$/g, '').split('/');
  console.log(urlPath);

  var source = function (request, response) {
    $.ajax({
      url: '/search-users',
      async: true,
      method: 'POST',
      data: {string: request.term},
      dataType: 'json'
    })
    .then(function (data){
      console.log(data);
      var users = [];
      for (var i = 0, len = data.length; i<len; i++) {
        var username = data[i].username;
        users.push({value: username, label: username});
      }
      return response(users);
      //return response(data);
    });
  };
  
  var $userList = $('#user-list');
  var $userInput = $('#add-user-input');
  var $hiddenUserList = $('#hidden-user-list');
  $userInput.attr({name: '', placeholder: 'search user'});
  $hiddenUserList.attr({name: 'usernames'});

  var selectedUsers = [];

  $userInput.autocomplete({
    source: source,
    //appendTo: '#add-tag',
    delay: 600,
    minLength: 2,
    select: function (e, ui) {
      if(selectedUsers.indexOf(ui.item.value) !== -1) return false;
      selectedUsers.push(ui.item.value);
      $hiddenUserList.val(selectedUsers.join(', '));
      addUser(ui.item.value);
      $userInput.val('');
      return false;
    }
  });

  function addUser(username) {
    //show unsaved tag in the list
    console.log('clicked tag');
    var user = new User({
      user: {username: username},
      click: userFunctions.click.call(user, {username: username}),
      close: userFunctions.close.call(user, {username: username}),
      saved: true
    });

    user.dom.main.appendTo($userList);
  }

  var userFunctions = {
    click: function (userData) {
      //link to the user page
      return function () {};
    },
    close: function (userData) {
      return function () {

        var index = selectedUsers.indexOf(this.user.username);
        if (index > -1) {
          selectedUsers.splice(index, 1);
        }
        $hiddenUserList.val(selectedUsers.join(', '));
        //remove this tag from th
        this.remove();
      };
    }
  };
});
