'use strict';

//var func = require('./talk-io/functions.js');

module.exports = function  (socket, params, io) {
  //console.log(socket.request, socket.request.session, socket.request.session.data);
  var sessUser = socket.request.session.user = socket.request.session.user || {logged: false, username: null};
  var users = params.users;
  //var logged = (sessUser && sessUser.logged === true) ? true : false;
  //var username = logged ? sess.username : null;
  //var myId = logged ? sess.id : null;
  
  if (sessUser.logged === true) {
    var username = sessUser.username;
    users[username] = users[username] || {
      username: username
    };
    users[username].sockets = users[username].sockets || [];
    users[username].sockets.push(socket);
  }

  socket.emit('auth', sessUser);

  
  //find talks in which user is involved and send them to user.
  /***func.getTalks(sessUser.username, {})
    .then(function (tks) {
      return func.processTalks(tks, sessUser);
    })
    .then(function (talks) {
      console.log('emitting', talks);
      for(var i=0, len=talks.length; i<len; i++){
        socket.join(talks[i].url);
      }
      socket.emit('list talks', {talks: talks});
    });
***/
  
  //when user wrote a new message, send it to everybody, who cares and has rights to care.
  socket.on('new message', function (data) {
    console.log(data);
    //validate data
    //save message to database
    func.saveMessage(data, {username: sessUser.username})
      .then(function (saved) {
        io.to(data.talk).emit('show message', {msg: saved, talk: data.talk});
      });
    //send message to the correct talk room.
  });

  //saving new talk
  socket.on('new talk', function (data) {
    console.log(data);
    data.me = username;
    data.usernames = data.users;
    //validate data {users[], dits[], message}
    func.validateNewTalk(data)
      .then(function () {
        console.log(1);
        return func.saveNewTalk(data);
      })
      .then(function (newTalk) {
        console.log(2, newTalk);
        return func.processTalk(newTalk, {logged: logged, username: username});
      })
      .then(function (newTalkProcessed) {
        console.log(3, newTalkProcessed);
        //join the talk room by me (all my active sockets)
        var sckts = users[username].sockets;
        for (var i = 0, len = sckts.length; i<len; i++) {
          console.log('joining', i);
          sckts[i].join(newTalkProcessed.url);
        }
        //join the talk room by all the other users (all their active sockets)
        var talkUsers = newTalkProcessed.participants.users;
        for (var i=0, len=talkUsers.length; i<len; i++) {
          var usrnm = talkUsers[i].username;
          console.log(users, usrnm);
          if(users.hasOwnProperty(usrnm)) {
            var sckts = users[usrnm].sockets;
            for (var j=0, len2=sckts.length; j<len2; j++) {
              console.log('others joining', j);
              sckts[j].join(newTalkProcessed.url);
            }
          }
        }
        console.log('ready to show');
        //io.to(newTalkProcessed.url).emit('add talk to list', newTalkProcessed);
        return showTalk({talk: newTalkProcessed});
      })
      .catch(function (e) {
        console.log('error', e);
      });
    //save talk to database
    //put talk to users array
    //return data to callback
  });

  function showTalk(data) {
    //data should be list of participants and messages (last several messages)
    socket.emit('start talk', data);
    console.log('showTalk', data);
  }

  socket.on('start talk', function (talk) {
    console.log(talk);
    func.setTalkViewed(true, talk.url, myId)
      .then(function (tak) {
        console.log('set', tak);
        return func.getTalk(talk);
      })
      .then(function (tk) {
        return func.processTalk(tk, {logged: logged, username: username});
      })
      .then(function (tk) {
        showTalk({talk: tk});
      })
      .catch(function (err) {
        console.log(err);
      });
  });

  socket.on('disconnect', function () {
    delete users[username];
    //give information to others that the user was disconnected
    console.log('client disconnected');
  });
};
