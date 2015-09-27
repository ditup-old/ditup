'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  console.log(req.session);
  var sessUser = req.session.user;
  res.render('talk', {session: {logged: sessUser.logged, username: sessUser.username}});
});

router.get('/:talkUrl', function (req, res, next) {
  var talkUrl = req.params.talkUrl;
  console.log(talkUrl);
  var sessUser = req.session.user;
  res.render('talk', {session: {logged: sessUser.logged, username: sessUser.username}});
});

module.exports=router;
