'use strict';

var express = require('express');
var router = express.Router();
var database = require('../services/data');
var accountService = require('../services/account');
var accountModule = require('../modules/account');

router.all('*', function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    sessUser.messages.push('you are logged in as <a href="/user/'+ sessUser.username +'" >' + sessUser.username + '</a>. To log in you need to <a href="/logout">log out</a> first.');
    return res.render('sysinfo', {session: sessUser});
  }
  else {
    next();
  }
});

router.get('/', function (req, res, next) {
  var sessUser = req.session.user;
  console.log(sessUser);
  res.render('login', {session: sessUser});
});

router.post('/', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.body.username;
  var password = req.body.password;
  var userData = {};
      
  return accountModule.matchPassword({username: username, password: password}, userData)
    .then(function (match) {
      if(match === true) {
        sessUser.logged = true;
        sessUser.username = username;
        console.log(userData);
        sessUser.name = userData.name;
        sessUser.surname = userData.surname;
        sessUser.email = userData.email;

        return database.updateUserAccount({username: username}, {last_login: Date.now()});
      }
      throw new Error('login not successful');
    })
    .then(function () {
      //console.log('redirect');

      //return res.render('sysinfo', {msg: 'login successful', session: sessUser});

      req.session.messages.push('login successful. you\'re logged in as <a href="/user/' + sessUser.username + '">' + ((sessUser.name || sessUser.surname ? sessUser.name + ' ' + sessUser.surname : '') || sessUser.username) + '</a>');
      res.redirect(req.session.history.current || '/');
      return;
      //res.redirect(req.session.history.current);
    })
    .then(null, function (err) {
      console.log(err.stack);
      if(err.message === 'login not successful') {
        sessUser.messages.push('login not successful');
        return res.render('login', {session: sessUser});
      }
      return next(err);
    });
});

module.exports = router;
