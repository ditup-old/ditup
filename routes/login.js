'use strict';

var express = require('express');
var router = express.Router();
var database = require('../services/data');
var accountService = require('../services/account');

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
  var hash, salt, iterations;
  database.readUser({username: username})
    .then(function (user) {
      console.log(user);
      hash = user.login.hash;
      salt = user.login.salt;
      iterations = user.login.iterations;

      //hash the provided password
      return accountService.hashPassword(password, salt, iterations);
    })
    .then(function (hash2) {
      console.log(hash2);
      //compare password hashes
      var isPasswordCorrect = accountService.compareHashes(hash, hash2);
      if(isPasswordCorrect !== true) {
        throw new Error('login not successful');      
      }
      else {
        sessUser.logged = true;
        sessUser.username = username;

        return database.updateUserAccount({username: username}, {last_login: Date.now()});
      }
    })
    .then(function () {
      //console.log('redirect');
      res.redirect(req.session.history.current);
    })
    .then(null, function (err) {
      console.log(err.stack);
      next(err);
    })
});

module.exports = router;
