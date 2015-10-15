'use strict';

module.exports = function (session, server) {
  var io = require('socket.io')();
  io.attach(server, {transports: ['websocket', 'polling']});
  var ioTalkMiddleware = require('./io/talk-io.js');

  io.serveClient(false);

  io.use(function(socket, next) {
    session(socket.request, socket.request.res, next);
  });

  var ioTalk = io.of('/talk-io');

//  var ioUsers = {};
  ioTalk
    .on('connection', function (socket) {
      ioTalkMiddleware(socket, {/*users: ioUsers*/}, ioTalk);
    });

  return io;
};
