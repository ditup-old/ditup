'use strict';

var express = require('express');
var router = express.Router();
var validate = require('../services/validation');
var database = require('../services/data');
var accountService = require('../services/account');
var accountModule = require('../modules/account');
var accountConfig = require('../config/user/account.json');

var ITERATIONS = accountConfig.password.iterations;

router.all('*', function(req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    return res.render('sysinfo', {msg: 'you are logged in as <a href="/user/'+ sessUser.username +'" >' + sessUser.username + '</a>. To sign up you need to <a href="/logout">log out</a> first.', session: sessUser});
  }
  else {
    next();
  }
});

router.get('/', function(req, res, next){
  //
  return res.render('signup', {errors: {}, values: {}});
});

router.post('/', function(req, res, next){
  var user = req.session.user;
  var form = req.body;
  var formData = {
    username: form.username,
    email: form.email,
    password: form.password,
    password2: form.password2
  };

  //first let's validate data from the form
  var errors = {};            
  var valid = validate.user.signup(formData, errors);
   
  //console.log(valid, errors, 'post signup');
  //now let's check if username and email are unique
  database.usernameExists(form.username)
    .then(function usernameExists(exists) {
      valid = valid && !exists;
      if(exists === true) errors.username.push('username must be unique');
      return database.emailExists(form.email);
    })
    .then(function emailExists(exists) {
      valid = valid && !exists;
      if(exists === true) errors.email.push('email must be unique');

      if(valid === true)
        return validBranch();
      else
        return invalidBranch();
    })
    //error handling
    .then(null, function (err) {
      console.log(err.stack);
      next(err);
    });
  
  //this function will happen if branch is valid
  function validBranch() {
    var salt;
    var hashed;

    //generate salt for password hash
    return accountService.generateSalt()
      .then(function (_salt) {
        salt = _salt;

        //generate hashed password
        return accountService.hashPassword(formData.password, salt, ITERATIONS);
      })
      .then(function (_hashed) {
        hashed = _hashed;

        //this user should be saved to database
        var newUser = {
          username: formData.username,
          email: formData.email,
          profile: {
            name: '',
            surname: '',
            birthday: null,
            gender: '',
            about: ''
          },
          account:{
            join_date: Date.now(),
            email: {
              verified: false
            },
            active_account: true,
            last_login: null,
            last_message_visit: null
          },
          login: {
            salt: salt,
            hash: hashed,
            iterations: ITERATIONS
          }
        };
        
        //save new user to database
        return database.createUser(newUser);
      })
      .then(function () {
        var username = formData.username;
        var email = formData.email;
        return accountModule.initEmailVerification({username: username, email: email});
      })
      .then(function () {
        //generate success message
        var message = 'Welcome ' + formData.username + '. Your new account was created and verification email was sent to ' + formData.email + '. It should arrive soon. In the meantime why don\'t you fill up your profile?';
        return res.render('sysinfo', {msg: message, session: user});
      
      });
  }

  function invalidBranch() {
    res.render('signup', { errors: errors, values: formData });
    return Q.resolve();
  }
});

module.exports = router;
