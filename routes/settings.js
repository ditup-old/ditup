'use strict';

let router = require('express').Router();
let co = require('co');
var processing = require('../services/processing');
let accountModule = require('../modules/account');
let validate = require('../services/validation/validate');

//check if i can see & change settings of user (basically: is it me?)
router.all('*', function (req, res, next) {
  var sessUser = req.session.user;
  
  if(sessUser.logged === true) {
    return next();
  }
  
  let e = new Error('Not Authorized');
  e.status = 403;
  return next(e);
});



//depends on router.all which checks the rights. this one is allowed only after checking those rights
//
// ***********send verification code************
router.post('/', function (req, res, next) {
  let db = req.app.get('database');
  var sessUser = req.session.user;

  return co(function * () {
    if(req.body.action === 'send verification code') {
      //marking that we processed the post
      req.ditup.postProcessed = true;

      //read the email of user
      let user = yield db.user.read({username: sessUser.username});
      let email = user.email;
      let isVerified = user.account.email.verified;

      //check if it is not verified
      if(isVerified) {
        sessUser.messages.push('your email is already verified.');
        return next();
      }

      //generate the data needed for verification
      //save the data to database
      //send the verification email
      yield accountModule.initEmailVerification({username: sessUser.username, email: email, database: db, host: req.app.get('host')});
      //give the information to user
      sessUser.messages.push(`A new verification code was sent to your email (${email}). Follow the link provided. Check also your spam folder.`);
      return next();
    }


    /*
    var form = {
      view: req.body.view
    };

    var errors = {};
    var values = {};

    let isValid = validate.user.settings(form, errors, values);

    if(isValid === true) {
      var settings = values;
      let response = yield db.updateUserSettings({username: username}, settings);
      sessUser.messages.push(`settings of <a href="/user/${username}" >${username}</a> were successfully updated`);
    }
    else {
      //for use in the next route
      req.ditup.settings = values;
      res.locals.errors = errors;
    }
    */
    return next();

  }).catch(next);
});

// ***********change email******************
router.post('/', function (req, res, next) {
  //we expect email and password. if password match, we create email code, save email & hash to database & send verification email.
  var sessUser = req.session.user;

  if(req.body.action === 'change email') {
    //marking that we processed the post
    req.ditup.postProcessed = true;

    var email = req.body['new-email'];
    var password = req.body.password;

    return co(function * () {
      //validating email
      validate.user.email(email); //will pass or throw error 400

      let db = req.app.get('database');

      //match password
      let match = yield accountModule.matchPassword({username: sessUser.username, password: password, database: db});

      //correct password
      //
      if(match === true) {
        //send verification email && save email & verification hashes && salts
        yield accountModule.initEmailVerification({username: sessUser.username, email: email, database: db, host: req.app.get('host')});
        sessUser.messages.push(`The email was changed. A verification code was sent to your email (${email}). Check also your spam folder.`);
      }
      //wrong password
      //
      else {
        sessUser.messages.push('the password is wrong');

        res.locals.values = {
          newEmail: email
        };
      }

      return next();
    })
    .catch(function (e) {
      if(e.message === 'duplicit email') {
        sessUser.messages.push('the email is duplicit');

        //sending the values to the view (to fill the forms)
        res.locals.values = {
          newEmail: email,
          password: password
        };

        return next();
      }
      else if(e.status === 400) {
        sessUser.messages.push('the email is invalid');
        res.locals.values = {
          newEmail: email,
          password: password
        }
        return next();
      }
      else return next(e);
    });
  }

  return next();
});

// *************** change password *****************
router.post('/', function (req, res, next) {
  let db = req.app.get('database');
  if(req.body.action === 'change password') {
    let password = req.body['new-password'];
    let sessUser = req.session.user;
    return co(function * () {
      yield accountModule.updatePassword({username: sessUser.username, password: password, database: db});

      sessUser.messages.push('the password was changed');

      return next();
    }).catch(next);
  }

  return next();
});

router.all('/', function (req, res, next) {
  let db = req.app.get('database');
  var sessUser = req.session.user;
  
  return co(function * () {
    //read settings
    let user = yield db.readUser({username: sessUser.username});

    //process settings
    let data = yield processing.user.settings(user);

    data.settings = req.ditup.settings || data.settings;

    //render the settings page
    return res.render('settings', {data: data});
  }).catch(next);
});

module.exports = router;
