'use strict'

/** this module serves as wrapper to provide higher-level account functions
  * it can contain functions like: verifying new email, resetting passwords etc.
  *
  *
  */

var validate = require('../services/validation');
var database = require('../services/data');
var accountService = require('../services/account');
var accountConfig = require('../config/user/account.json');
var mailer = require('../services/mailer/mailer');

var ITERATIONS = accountConfig.password.iterations;


var exports = module.exports = {};

exports.initEmailVerification = function (data) {
  var username = data.username;
  var email = data.email;
  //create verification code, salt & hash

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
      var user = {
        username: username,
        email: email
      };
      return database.updateUserEmailVerifyCode(user, data);
    })
    .then(function sendEmail() {
      var mailerData = {
        username: username,
        email: email,
        url: 'http://ditup.org/account/verify-email/'+username+'/'+code //TODO https!!!
      };
      return mailer.send.verifyEmail(mailerData);
    });
};

exports.verifyEmail = function (data) {
  var username = data.username;
  var code = data.code;

  var hash, salt, iterations, createDate;
  
  //first read user from database (async)
  return database.readUser({username: username})
    .then(function (user) {
      //if user is already verified, don't continue
      if(user.account.email.verified === true) throw new Error('user ' + username + ' has already verified email');

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
      return database.updateUserEmailVerified({username: username}, {verified: true, verifyDate: Date.now()});
    });
};
