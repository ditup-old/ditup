'use strict';

var co = require('co');
var express = require('express');
var router = express.Router();

var db = require('../services/data');

const MAX_MESSAGE_LENGTH = 16384;

//authorize all
router.all(['/', '/:username'], function (req, res, next) {
  let sessUser = req.session.user;
  let username = req.params.username;
  if(sessUser.logged !== true) {
    let err = new Error('403 - not authorized');
    err.status = 403;
    return next(err);
  }
  return next();
});

router.get('/', function(req, res, next) {
  let sessUser = req.session.user;
  return co(function *() {
    let lastMessages = yield db.messages.readLast(sessUser.username);
    return res.render('messages', {session: sessUser, lastMessages: lastMessages});
  })
  .catch((err) => {return next(err);});
});

//if post, post message
router.post('/:username', function(req, res, next) {
  let username = req.params.username;
  let sessUser = req.session.user;
  let message = req.body.message;

  //sending to oneself
  if(sessUser.username === username) {
    let err = new Error('sending to oneself is not possible');
    err.status = 400; //TODO find out better status
    return next(err);
  }

  //validate message
  if(message.length === 0) {
    sessUser.messages.push('the message cannot be empty');
    return next();
  }
  if(message.length > MAX_MESSAGE_LENGTH) {
    sessUser.messages.push('the message is too long');
    return next();
  }

  return co(function *() {
    let response = yield db.messages.create({from: sessUser.username, to: username, text: message});
    sessUser.messages.push('the message was sent successfully');
    return next();
  })
  .catch(function (err) { next(err); });
});

router.all('/:username', function (req, res, next) {
  let sessUser = req.session.user;
  let username = req.params.username;
  
  //sending messages to oneself not possible
  if(sessUser.username === username) {
    return res.redirect('/messages');
  }

  return co(function *() {
    let messages = yield db.messages.read([sessUser.username, username]);
    yield db.messages.view({from: username, to: sessUser.username});

    //update the user's messages count
    let count = yield db.messages.countUnread(sessUser.username);
    sessUser.unreadMessagesCount = count;

    return res.render('messages-user', {session: sessUser, recipient: {username: username}, messages: messages});
  })
  .catch(function (err) {
    return next(err);
  });

});

module.exports = router;
