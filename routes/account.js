'use strict';

var express = require('express');
var router = express.Router();
var accountModule = require('../modules/account');
var validate = require('../services/validation');
var database = require('../services/data');


router.get('/verify-email/:username/:code', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  var code = req.params.code;
  
  var verifyData ={username: username, code: code};
  return accountModule.verifyEmail(verifyData)
    .then(function () {
      return res.render('sysinfo', {msg: 'verification successful', session: sessUser});
    })
    .then(null, function (err) {
      console.log(err.stack);
      return next(err);
    });
});

router.get('/reset-password', function (req, res, next) {
  //form to provide username or email of account to reset password
  var sessUser = req.session.user;
  return res.render('account/request-reset-password', {session: sessUser});
});

router.post('/reset-password', function (req, res, next) {
  //here we (check if email is verified) and if yes, we (create & save (hashed) code) and (send link for resetting password to email)
  var sessUser = req.session.user;
  var usernameEmail = req.body['username-email'];
  
  var isUsername = validate.user.username(usernameEmail);
  var isEmail = validate.user.email(usernameEmail);
  //check if input is username or email
  var user;
  return Promise.all([isUsername, isEmail])
    .then(function (response) {
      var _isUsername = response[0];
      var _isEmail = response[1];
      if(_isUsername) return database.readUser({username: usernameEmail});
      if(_isEmail) return database.readUser({email: usernameEmail});
      throw new Error ('not valid user nor email provided');
    })
    .then(function (_user){
      user = _user;
      if(user === null) throw new Error('user not found');
      var isVerified = user.account.email.verified;
      if(isVerified !== true) throw new Error('can\'t send email - is not verified. you can contact admins at this point.');
      return accountModule.initResetPassword({username: user.username, email: user.email});
    })
    .then(function (resp) {
      return res.render('sysinfo', {msg: 'email with reset code should arrive to your inbox soon', session: sessUser});
    })
    .then(null, function (err) {
      return next(err);
    });

});

router.all('/reset-password/:username/:code', function (req, res, next) {
  //we check validity of the link and on valid, next(), otherwise next(err);
  //validity: not expired (30 minutes?) & username-code match
  var username = req.params.username;
  var code = req.params.code;
  var validUsername = validate.user.username(username);
  var validCode = validate.user.code(code);
  return Promise.all([validUsername, validCode])
    .then(function (_resp) {
      if(_resp[0] !== true || _resp[1] !== true) throw new Error('provided url is not valid');
      return accountModule.isResetPasswordCodeValid({username: username, code: code});
      //return true;
    })
    .then(function (isValid) {
      if(isValid === true) return next();
      var err = new Error('invalid username/code (wrong or expired)');
      return next(err);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.get('/reset-password/:username/:code', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('account/reset-password', {errors: {}, session: sessUser});
  //validity of the link was already checked.
  //we show form for resetting password (add new password twice)
});

router.post('/reset-password/:username/:code', function (req, res, next) {
  //validity of the link was already checked.
  //we validate and save the new password. maybe log in.
  var sessUser = req.session.user;
  var username = req.params.username;
  var password = req.body.password;
  var password2 = req.body.password2;
  
  var errors = {};
  return Promise.resolve(validate.user.passwords([password, password2], errors))
    .then(function (valid) {
      if(valid === true) return validBranch();
      return invalidBranch();
    })
    .then(null, function (err) {
      return next(err);
    });

  function validBranch() {
    return accountModule.updatePassword({username: username, password: password})
      .then(function () {
        return res.render('sysinfo', {msg: 'password was successfully changed. Try to log in.', session: sessUser});
      });
  }

  function invalidBranch() {
    return res.render('account/reset-password', {errors: errors, session: sessUser});
  }
});

//continue only for logged in users
router.all(['/change-password', '/change-email', '/delete-user'], function (req, res, next) {
  var sessUser = req.session.user;

  var notLoggedIn = new Error('you need to log in to continue');

  if(sessUser.logged !== true) return next(notLoggedIn);

  return next();
});

router.post('/change-password', function (req, res, next) {
  //we expect old password and new password twice. if match of old and new is valid, we rewrite old with new (hashed)
});

router.post('/change-email', function (req, res, next) {
  //we expect email and password. if password match, we create email code, save email & hash to database & send verification email.
});

router.get('/delete-user', function (req, res, next) {
  //warning about deleting all data and losing access to work.
  //give form for deleting user, ask for feedback why (optional)
});

router.post('/delete-user', function (req, res, next) {
  //we expect password of user and optionally feedback.
  //if password matches (if feedback is not empty, we save it) we delete user & her links, we log her out and say goodbye.
});

module.exports = router;