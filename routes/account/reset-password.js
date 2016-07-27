'use strict';

var express = require('express');
var router = express.Router();
var co = require('co');
var validate = require('../../services/validation');
var accountModule = require('../../modules/account');

/**
 * display form to provide username or email of account to reset password
 */
router.get('/', function (req, res, next) {
  //form to provide username or email of account to reset password
  var sessUser = req.session.user;
  return res.render('account/request-reset-password', {session: sessUser});
});

/**
 * here we (check if email is verified) and if yes, we (create & save (hashed) code) and (send link for resetting password to email)
 */
router.post('/', function (req, res, next) {
  var db = req.app.get('database');
  var sessUser = req.session.user;

  // this form field requires either username or email
  var usernameEmail = req.body['username-email'];


  return co(function *() {
    //check if input is username or email
    var isUsername = validate.user.username(usernameEmail);
    var isEmail = validate.user.email(usernameEmail);

    //read user from database
    var user;
    if(isUsername) {
      user = yield db.user.read({username: usernameEmail});
    }
    else if(isEmail) {
      user = yield db.user.read({email: usernameEmail});
    }
    else {
      let err = new Error('not valid user nor email provided');
      err.code = 400;
      throw err;
    }
    
    //error if user was not found
    if(user === null) {
      let err = new Error('user not found');
      err.code = 404;
      throw err;
    }
   
    //checking if email is verified - whether it's possible to send emails
    var isVerified = user.account.email.verified;
    if(isVerified !== true) throw new Error('can\'t send email - is not verified. you can contact admins at this point.');

    
    //if email is verified we send the email with reset password code
    yield accountModule.initResetPassword({username: user.username, email: user.email});
    
    //rendering some info
    return res.render('sysinfo', {msg: 'email with reset code should arrive to your inbox soon', session: sessUser});
  })
    .catch(next);
});

/**
 * checking validity of the link /:username/:code
 * validity := not expired (30 minutes?) & username-code match
 * validity checking provided in module accountModule.isResetPasswordCodeValid
 *
 *
 */
router.all('/:username/:code', function (req, res, next) {
  //we check validity of the link and on valid, next(), otherwise next(err);
  var username = req.params.username;
  var code = req.params.code;

  //validate the validity of username and url with regex from account module
  var validUsername = validate.user.username(username);
  var validCode = validate.user.code(code);
  if(validUsername !== true || validCode !== true) throw new Error('provided url is not valid');

  return co(function *() {
    //check whether the password code is valid
    var isValid = yield accountModule.isResetPasswordCodeValid({username: username, code: code});
    if(isValid !== true) throw new Error('invalid username/code (wrong or expired)');
    
    //if everything passed continue
    return next();
  })
    .catch(next);
});

/**
 * vaidity of the link was already checked in a router above
 *
 * we show form for resetting password (add new password twice)
 */
router.get('/:username/:code', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('account/reset-password', {errors: {}, session: sessUser});
});


/**
 * vaidity of the link was already checked in a router above
 *
 * we validate and save the new password. maybe log in.
 */
router.post(':username/:code', function (req, res, next) {
  //validity of the link was already checked.
  var sessUser = req.session.user;
  var username = req.params.username;
  var password = req.body.password;
  var password2 = req.body.password2;
  
  return co(function *() {
    var errors = {};
    //are the passwords matching and in a correct format?
    var valid = validate.user.passwords([password, password2], errors);
    if(valid === true) {
      //update password
      yield accountModule.updatePassword({username: username, password: password});
      //display some info
      return res.render('sysinfo', {msg: 'password was successfully changed. Try to log in.', session: sessUser});
    } 
    else {
      //display password errors
      return res.render('account/reset-password', {errors: errors, session: sessUser});
    }
  })
    .catch(next);
});

module.exports = router;
