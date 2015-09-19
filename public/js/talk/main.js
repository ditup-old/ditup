'use strict';

require.config({
  baseUrl: '/js/talk/',
  paths: {
    jquery: '/libs/js/jquery',
    socketio: '/socket.io/socket.io'
  }
});

require(['TalkList', 'Talk', 'jquery', 'socketio'], function (TL, TK, $, io) {
  //DOM elements
  var $chat = $('#chat');
  var $sendMessage = $('#send-message');
  var $message = $('#message');
  var $newTalkFormWrap = $('#new-talk-form-wrap');
  var $newTalkForm = $('#new-talk-form');
  var $newTalkMsg = $('#new-talk-msg');
  var $newTalkButton = $('#new-talk-button');
  var $talkList = $('#talk-list');


  //variables
  var newTalkUsers = [];
  var newTalkDits = [];

  var activeTalk;

  var me = {logged: false, username: 'guest'};


//****************incoming socket
  var socket = io(':3000/talk-io');
  //var socket = io();

  var TalkList = new TL({
    dom: {
      list: $talkList
    },
    socket: socket
  });

  socket.on('connect', function () {
    $chat.append('connected to the server<br />');
  });

  socket.on('auth', function (sess) {
    $chat.append('you are '+(sess.logged !== true ? 'not ': '')+'logged in'+(sess.logged === true ? (' as '+ sess.username) : '')+'.<br />');
    me = {logged: sess.logged, username: sess.username || me.username}
  });
  
  //show available talks
  socket.on('list talks', function (data) {
    //console.log(JSON.stringify(data));
    var talks = data.talks;
    for(var len=talks.length-1; len>=0; len--) {
      TalkList.addTalk(talks[len]);
    }
  });

  //open a talk
  socket.on('start talk', function (data) {
    //console.log('start a talk', data);
    window.history.pushState({html: 'talk/' + encodeURIComponent(data.talk.url), pageTitle: 'talk ' + data.talk.url}, '', '/talk/' + encodeURIComponent(data.talk.url));
    activeTalk = new TK({
      dom: {
        chat: $chat
      },
      talk: data.talk
    });
    TalkList.addTalk({
      url: data.talk.url,
      viewed: data.talk.viewed,
      lastMessage: data.talk.messages[data.talk.messages.length-1]
    });
    TalkList.sort();
  });

  socket.on('show message', function (data) {
    console.log(data);
    if(activeTalk.url === data.talk){
      activeTalk.addMessage(data.msg);
    }
    var talkFragment = {
      url: data.talk,
      viewed: data.msg.from.username === me.username ? true : false,
      lastMessage: data.msg
    };
    TalkList.addTalk(talkFragment);

  });

  //socket.on('add talk to list', function (talk) {
  //  console.log('add talk to list', talk);
    //TalkList.addTalk(talk);
  //});

  socket.on('disconnect', function () {
    $chat.append('disconnected from the server<br />');
  });

  $sendMessage.on('submit', function (e) {
    e.preventDefault();
    var msg = $message.val();
    $message.val('');
    socket.emit('new message', {msg: msg, talk: activeTalk.url});
  });
  
  //this piece shows or hides form which starts a new talk to users
  $newTalkButton.on('mouseup', function (e) {
    console.log('clicked');
    e.preventDefault();
    hideShowNewTalk(ntbOn);
  });

  var ntbOn = false;
  function hideShowNewTalk(show) {
    ntbOn = !ntbOn;
    if(ntbOn === true){
      console.log('show');
      $newTalkFormWrap.show();
      $newTalkButton.text('Cancel the new talk');
    }
    else {
      console.log('hide');
      $newTalkFormWrap.hide();
      $newTalkButton.text('Start a new talk');
    }
  }

  $newTalkForm.on('submit', function (e) {
    e.preventDefault();
    var msg = $newTalkMsg.val();
    if(newTalkUsers.length + newTalkDits.length > 0 && msg) {
      socket.emit('new talk', {
        users: newTalkUsers,
        dits: newTalkDits,
        message: msg
      });

      clearNewTalk();
      hideShowNewTalk(false);
    }
  });

  function clearNewTalk() {
    newTalkUsers = [];
    newTalkDits = [];
    $('#new-talk-participants').empty();
    $newTalkMsg.val('');
    $('#new-talk-form input[type=text]').val('');
  }

  $('#new-talk-form input[type=text]')
  //.bind('keypress', false)
  .on('focusout',function(){    
    var txt= this.value.replace(/[^a-zA-Z0-9\+\-\.\#]/g,''); // allowed characters
    if(txt) {
      if(newTalkUsers.indexOf(txt) === -1) {
        newTalkUsers.push(txt);
        $('#new-talk-participants').append(' <span class="new-participant" style="background-color:blue;" >'+ txt.toLowerCase() +'</span> ');
      }
    }
    this.value='';
  }).on('keypress',function( e ){
  // if: comma,enter (delimit more keyCodes with | pipe)
    if(/(188|13)/.test(e.which)){
      console.log('pressed enter', e);
      $(this).focusout(); 
      e.preventDefault();
      return false;
    }
  });


  $('#new-talk-participants').on('click','.new-participant',function(){
    console.log('click');
    var index = newTalkUsers.indexOf($(this).text());
    if (index > -1) {
      newTalkUsers.splice(index, 1);
      console.log('removed');
    }
    $(this).remove(); 
  });


});
