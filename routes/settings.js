'use strict';

let router = require('express').Router();
let co = require('co');
var processing = require('../services/processing');

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
router.post('/', function (req, res, next) {
  let db = req.app.get('database');
  var sessUser = req.session.user;

  return co(function * () {
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
    return next();

  }).catch(next);
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
