'use strict';

var util = require('util');
var express = require('express');
var co = require('co');
var router = express.Router();
var accountModule = require('../modules/account');
var validate = require('../services/validation');
var database = require('../services/data');
var resetPassword = require('./account/reset-password');

//** loading router for resetting password
router.use('/reset-password', resetPassword);

/**
 * when email is changed, a code is generated and saved to the database & 'verified' is set to false in database
 * an email with a verify link is sent to the user
 * here if :code matches the generated code for user :username, 'verified' will be updated to true in database
 */
router.get('/verify-email/:username/:code', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  var code = req.params.code;
  
  var verifyData ={username: username, code: code};

  return co(function *() {
    yield accountModule.verifyEmail(verifyData);
    return res.render('sysinfo', {msg: 'verification successful', session: sessUser});
  })
    .catch(next);
});


//continue only for logged in users
router.all(['/change-password', '/change-email', '/delete-user'], function (req, res, next) {
  var sessUser = req.session.user;

  var notLoggedIn = new Error('you need to log in to continue');

  if(sessUser.logged !== true) return next(notLoggedIn);

  return next();
});

//already logged in
router.post('/change-password', function (req, res, next) {
  //we expect old password and twice new password. if match of old and new is valid, we rewrite old with new (hashed)
  var sessUser = req.session.user;
  var oldPassword = req.body['old-password'];
  var password = req.body.password;
  var password2 = req.body.password2;

  var inputValid = validate.user.password(oldPassword);

  var errors = {};
  return Promise.all([inputValid, validate.user.passwords([password, password2], errors)])
    .then(function (valid) {
      if(valid[0] && valid[1] === true) return validBranch();
      return invalidBranch();
    })
    .then(null, function (err) {
      return next(err);
    });

  function validBranch() {
    return accountModule.matchPassword({username: sessUser.username, password: oldPassword})
      .then(function (res) {
        if(res === true) return accountModule.updatePassword({username: sessUser.username, password: password});
        throw new Error('wrong password');
      })
      .then(function () {
        return res.render('sysinfo', {msg: 'password was successfully changed', session: sessUser});
      });
  }

  function invalidBranch() {
    return res.render('sysinfo', {msg: util.inspect(errors), session: sessUser});
  }
});

router.post('/change-email', function (req, res, next) {
  //we expect email and password. if password match, we create email code, save email & hash to database & send verification email.
  var sessUser = req.session.user;
  var email = req.body.email;
  var password = req.body.password;
  
  var errors = {email: []};
  //validate data provided
  var passValid = validate.user.password(password);
  var emailValid = validate.user.email(email, errors);

  var valid = passValid && emailValid;
  if (valid !== true) throw new Error ('email or password is invalid (better UX!! TODO)');
  
  //check if password matches database
  return accountModule.matchPassword({username: sessUser.username, password: password})
    .then(function (match) {
      //save new email and send verification link
      if(match === true) return accountModule.initEmailVerification({username: sessUser.username, email: email});
      throw new Error('wrong password');
    })
    .then(function (_resp) {
      return res.render('sysinfo', {msg: 'email successfuly changed. message with verification link was sent to the address. it should arrive soon. please verify.', session: sessUser});
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.get('/delete-user', function (req, res, next) {
  //warning about deleting all data and losing access to work.
  //give form for deleting user, ask for feedback why (optional)
  var sessUser = req.session.user;
  return res.render('account/delete-user', {session: sessUser});
});

router.post('/delete-user', function (req, res, next) {
  //we expect password of user and optionally feedback.
  //if password matches (if feedback is not empty, we save it) we delete user & her links, we log her out and say goodbye.

  //validate checkbox, validate feedback, validate password
  //
  //check if password matches
  //save feedback (with text, date, username and reference)
  //delete user
  //destroy session
  //give information that user was successfuly deleted
  var sessUser = req.session.user;
  var password = req.body.password;
  var checked = req.body['confirm'] === 'checked' ? true : false;
  var feedback = req.body.feedback;

  var passValid = validate.user.password(password);
  var fbValid = validate.feedback.text(feedback);

  if(passValid !== true) throw new Error('password invalid');
  if(checked !== true) throw new Error('you must confirm your educated responsibility');

  //check if password matches
  return accountModule.matchPassword({username:sessUser.username, password: password})
    .then(function (match) {
      if(match === true) {
        if(fbValid === true) {
          //save feedback (with text, date, username and reference)
          let user = {username: sessUser.username, logged: true};
          let feedbackData = {
            from: user,
            context: 'user deletion',
            text: feedback
          };
          return database.feedback.create(feedbackData)
            .then(function () {
              return true;
            });
        }
        return false;
      }
      throw new Error('wrong password');
    })
    .then(function () {
      //delete user
      return accountModule.deleteUser({username: sessUser.username});
    })
    .then(function () {
      var username = sessUser.username;
      req.session.user.logged = false;
      req.session.user.username = null;

      var message = 'Dear ' + username + ', your account was successfuly deleted. Thank you for the time we spent together.' + (fbValid === true ? ' Thank you for your feedback.' : '');
      req.session.messages.push(message);
      return res.redirect('/');
    })
    .then(null, function (err) {
      return next(err);
    });
});

module.exports = router;
