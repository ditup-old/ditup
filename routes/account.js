'use strict';

var express = require('express');
var router = express.Router();
var accountModule = require('../modules/account');


router.get('/verify-email/:username/:code', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  var code = req.params.code;
  
  var verifyData ={username: username, code: code};
  return accountModule.verifyEmail(verifyData)
    .then(function () {
      res.render('sysinfo', {msg: 'verification successful', session: sessUser});
    })
    .then(null, function (err) {
      console.log(err.stack);
      next(err);
    });
});

router.get('/reset-password', function (req, res, next) {
  //form to provide username or email of account to reset password
});

router.post('/reset-password', function (req, res, next) {
  //here we (check if email is verified) and if yes, we (create & save (hashed) code) and (send link for resetting password to email)
});

router.all('/reset-password/:username/:code', function (req, res, next) {
  //we check validity of the link and on valid, next(), otherwise next(err);
  //validity: not expired (30 minutes?) & username-code match
});

router.get('/reset-password/:username/:code', function (req, res, next) {
  //validity of the link was already checked.
  //we show form for resetting password (add new password twice)
});

router.post('/reset-password/:username/:code', function (req, res, next) {
  //validity of the link was already checked.
  //we validate and save the new password. maybe login.
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
