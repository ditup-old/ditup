'use strict';

var database = require('../services/data');

module.exports = function  (socket, params, io) {
  var session = socket.request.session;

  socket.emit('auth', session.user);
  //var session.user = session.user = socket.request.session.user || {logged: false, username: null};

  //***user joins her own room (what is it good for?)
  //***it is possible to broadcast to all sockets of that user.
  if(session.user.logged === true) {
    /* joining group of user's sockets */
    socket.join('/user/'+session.user.username);

    /* testing number of sockets of user */
    let room = io.adapter.rooms['/user/' + session.user.username];
    let connectno = Object.keys(room).length;
    console.log('**********', room, connectno);
    /* and sending number of already connected sockets to other user connections */
    socket.broadcast.to('/user/'+session.user.username).emit('new-connection', {username: session.user.username, connectno: connectno});
  }


  /**
   * @param {Object} data
   * @param {string} [data.topic=""] Topic of new talk
   * @param {string} data.usernames Comma separated list of usernames
   * @param {string} data.message Initial message from user
   *
   */
  socket.on('new-talk', function (data) {
    session.reload();
    if(session.user.logged === true) {
      let userInput = data.usernames; 
      let rawUsernames = tagInput.replace(/\s*,?\s*$/,'').split(/\s*,\s*|\s+/); 
      let users = [{username: session.user.username}]; 
      for(let raw of rawUsernames){ 
        let valid = validate.username(raw); 
        if(valid === true) users.push({username: raw}); 
      } 
      console.log({topic: data.topic, users: users, message: data.message});
    }
    else {
      
    }
  });


  //if user is logged in, generating and sending talk list
  //console.log('before talk-list logged',session.user.logged);
  if(session.user.logged === true) {
    //let oldUsername = session.user.username;
    return database.talk.readTalksOfUser({username: session.user.username})
      .then(function (talks) {
        //session.reload();
        //if(session.user.logged === true && oldUsername === session.user.username)
          console.log(talks);
          socket.emit('talk-list', {talks});

      })
      .then(null, function (err) {
        console.log(err);
        socket.emit('talk-list', {error: err});
      });
  }
    
  /*
    if(session.user.logged === true) {
      var username = session.user.username;
      users[username] = users[username] || {
        username: username
      };
      users[username].sockets = users[username].sockets || [];
      users[username].sockets.push(socket);
    }
  */

  socket.on('disconnect', function () {
//    delete users[username];
    //give information to others that the user was disconnected
    console.log('client disconnected');
  });
};
