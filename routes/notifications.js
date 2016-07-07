'use strict';

var co = require('co');
var express = require('express');
var router = express.Router();

var db = require('../services/data');

//authorization of user. If not authorized, response with status 403.
router.all('/', function (req, res, next) {
  let sessUser = req.session.user;
  let username = req.params.username;
  if(sessUser.logged !== true) {
    let err = new Error('403 - not authorized');
    err.status = 403;
    return next(err);
  }
  return next();
});

router.get('/', function (req, res,next) {
  let sessUser = req.session.user;
  
  return co(function *() {
    let notifications = yield db.notifications.read(sessUser.username);
    //yield db.messages.view({from: username, to: sessUser.username});
    return res.render('notifications', {session: sessUser, notifications: notifications});
  })
  .catch(function (err) {
    return next(err);
  });
});

module.exports = router;
