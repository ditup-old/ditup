'use strict';

var express = require('express');
var router = express.Router();
var database = require('../services/data');
var accountService = require('../services/account');
var accountModule = require('../modules/account');

router.all('*', function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    return res.render('sysinfo', {msg: 'you are logged in as <a href="/user/'+ sessUser.username +'" >' + sessUser.username + '</a>. To log in you need to <a href="/logout">log out</a> first.', session: sessUser});
  }
  else {
    next();
  }
});

router.get('/', function (req, res, next) {
  var sessUser = req.session.user;
  res.render('login', {session: sessUser});
});

router.post('/', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.body.username;
  var password = req.body.password;
      
  return accountModule.matchPassword({username: username, password: password})
    .then(function (match) {
      if(match === true) {
        sessUser.logged = true;
        sessUser.username = username;

        return database.updateUserAccount({username: username}, {last_login: Date.now()});
      }
      throw new Error('login not successful');
    })
    .then(function () {
      //console.log('redirect');
      return res.render('sysinfo', {msg: 'login successful', session: sessUser});
      //res.redirect(req.session.history.current);
    })
    .then(null, function (err) {
      console.log(err.stack);
      next(err);
    })
});

module.exports = router;
