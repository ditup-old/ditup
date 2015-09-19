'use strict';

var express = require('express');
var router = express.Router();
var validate = require('../services/validation');
var database = require('../services/data');
var accountService = require('../services/account');
var accountConfig = require('../config/user/account.json');

var ITERATIONS = accountConfig.password.iterations;

/* GET signup page. */
router.get('/verify-email/:username/:code', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  var code = req.params.code;
  
  var hash, salt, iterations, createDate;
  
  //first read user from database (async)
  return database.readUser({username: username})
    .then(function (user) {
      //if user is already verified, don't continue
      if(user.account.email.verified === true) throw new Error('user ' + username + ' is already verified');

      hash = user.account.email.hash;
      salt = user.account.email.salt;
      iterations = user.account.email.iterations;
      createDate = user.account.email.create_date;
      
      //check that create_date of code is not older than 2 hours
      var isExpired = Date.now() - createDate > 2*3600*1000;
      if(isExpired) throw new Error('code is expired');

      //hash verification code (async)
      return accountService.hashPassword(code, salt, iterations);
    })
    .then(function (hash2) {
      //compare hash codes
      var areHashesEqual = accountService.compareHashes(hash, hash2);
      if(areHashesEqual !== true) throw new Error('code is wrong');
      //
      return database.updateUserEmailVerified({username: username}, {verified: true, verify_date: Date.now()});
    })
    .then(function () {
      res.render('sysinfo', {msg: 'verification successful', session: sessUser});
    })
    .then(null, function (err) {
      console.log(err.stack);
      next(err);
    });
});

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
  var valid = validate.signup.all(formData, errors);
   
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
        //send verification email
        var code;
        var salt;
        var hash;
        return accountService.generateHexCode(16)
          .then(function (_code){
            code = _code;
            return accountService.generateSalt();
          })
          .then(function (_salt) {
            salt = _salt;
            return accountService.hashPassword(code, salt, ITERATIONS);
          })
          .then(function (_hash) {
            hash = _hash;
            var data = {
              create_date: Date.now(),
              hash: hash,
              salt: salt,
              iterations: ITERATIONS
            };

            return database.updateUserEmailVerifyCode({username: formData.username}, data);
          })
          .then(function sendEmail() {
            //TODO the email sending!!! (with link /signup/verify-email/:username/:code)
            console.log(formData.username, code);
          });
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
