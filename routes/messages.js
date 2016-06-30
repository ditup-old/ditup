'use strict';

var co = require('co');
var express = require('express');
var router = express.Router();

var db = require('../services/data');

router.get('/', function(req, res, next) {
  res.end('TODO show list of message threads with users');
});

//authorize all
router.all('/:username', function (req, res, next) {
  let sessUser = req.session.user;
  let username = req.params.username;
  if(sessUser.logged !== true) {
    let err = new Error('403 - not authorized');
    err.status = 403;
    return next(err);
  }
  return next();
});

//if post, post message
router.post('/:username', function(req, res, next) {
  let username = req.params.username;
  let sessUser = req.session.user;
  let message = req.body.message;

  //sending to oneself
  if(sessUser.username === username) {
    let err = new Error('sending to oneself is not possible');
    err.status = 500; //TODO find out better status
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
    return res.render('messages-user', {session: sessUser, recipient: {username: username}, messages: messages});
  })
  .catch(function (err) {
    return next(err);
  });

});

module.exports = router;
