'use strict';

var express = require('express');
var router = express.Router();
var validate = require('../services/validation');
var database = require('../services/data');
var accountService = require('../services/account');
var accountModule = require('../modules/account');
var accountConfig = require('../config/user/account.json');

const ITERATIONS = accountConfig.password.iterations;

router.all('*', function(req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    sessUser.messages.push('you are logged in as <a href="/user/'+ sessUser.username +'" >' + sessUser.username + '</a>. To sign up you need to <a href="/logout">log out</a> first.');
    return res.render('sysinfo', {session: sessUser});
  }
  else {
    next();
  }
});

router.get('/', function(req, res, next){
  var sessUser = req.session.user;
  //
  return res.render('signup', {errors: {}, values: {}, session: sessUser});
});

router.post('/', function (req, res, next) {
  var sessUser = req.session.user;
  var form = req.body;
  var formData = {
    username: form.username,
    email: form.email,
    password: form.password,
    password2: form.password2
  };
  
  return accountModule.createUser(formData)
      .then(function () {
        var username = formData.username;
        var email = formData.email;
        return accountModule.initEmailVerification({username: username, email: email});
      })
      .then(function () {
        //generate success message
        sessUser.username = formData.username;
        sessUser.logged = true;
        var message = 'Welcome ' + formData.username + '. Your new account was created and verification email was sent to ' + formData.email + '. It should arrive soon. In the meantime why don\'t you fill up your profile?';
        req.session.messages.push(message);
        return res.redirect('/user/' + formData.username + '/edit');
      
      })
      .then(null, function (err) {
        if(err.message === 'invalid data') {
          sessUser.messages.push('there were some errors in processing signup request');
          return res.render('signup', { errors: err.errors, values: formData, session: sessUser});
        }
        return next(err);
      });
});

module.exports = router;
