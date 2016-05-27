'use strict';

var express = require('express');
var router = express.Router();

router.get(['/'], function (req, res, next) {
  return res.end();
});

router.all('/new', function (req, res, next) {
  var sessUser = req.session.user;
  var logged = sessUser.logged;
  if(logged !== true) {
    sessUser.messages = sessUser.messages || [];
    sessUser.messages.push('you need to <a href="/login?redirect=%2Fprojects%2Fnew" >log in</a> to create a new project');
    return res.render('login', {session: sessUser, action: '/login?redirect=%2Fprojects%2Fnew'});
  }

  return next();
});

router.get('/new', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('projects-new', {session: sessUser});
});

module.exports = router;
