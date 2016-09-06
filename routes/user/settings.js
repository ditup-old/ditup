'use strict';

let router = require('express').Router();
var processing = require('../../services/processing');

//check if i can see & change settings of user (basically: is it me?)
router.all('/:username/settings', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  
  if(sessUser.logged === true && sessUser.username === username) {
    return next();
  }
  
  let e = new Error('Not Authorized');
  e.status = 403;
  return next(e);
});

router.get('/:username/settings', function (req, res, next) {
  let database = req.app.get('database');
  //read settings
  //process settings
  //render settings page

  var sessUser = req.session.user;
  var username = req.params.username;

  var user;
  
  //read settings
  return database.readUser({username: username})
    .then(function (_user) {
      if(_user === null) throw (new Error('user does not exist (this should not ever happen! already checked that user is me.)').status(404)); 
      user = _user;
      
      //process settings
      return processing.user.settings(user);
    })
    .then(function (_data) {
      //render the settings page
      res.render('user-settings', {data: _data, errors: {}});
    })
    .then(null, function (err) {
      next(err);
    });
});


//depends on router.all which checks the rights. this one is allowed only after checking those rights
router.post('/:username/settings', function (req, res, next) {
  let database = req.app.get('database');
  var sessUser = req.session.user;

  var username = req.params.username;
  var form = {
    view: req.body.view
  };

  var errors = {};
  var values = {};

  return Promise.resolve(validate.user.settings(form, errors, values))
    .then(function (isValid) {
      if(isValid === true) return validBranch();
      else return invalidBranch();
    })
    .then(null, function (err) {
      next(err);
    });


  function validBranch() {
    var settings = values;
    return database.updateUserSettings({username: username}, settings)
      .then(function (response) {
        return res.render('sysinfo', {msg: '<a href="" >settings</a> of <a href="/user/' + username + '" >' + username + '</a> were successfully updated'});
      });
  }
  
  function invalidBranch() {
    var user;
    
    //read settings
    return database.readUser({username: username})
      .then(function (_user) {
        if(_user === null) throw (new Error('user does not exist (this should not ever happen! already checked that user is me.)').status(404)); 
        user = _user;
        
        //process settings
        return processing.user.settings(user);
      })
      .then(function (_data) {
        _data.settings = values;
        //render the settings page
        res.render('user-settings', {data: _data, errors: errors});
      })
      .then(null, function (err) {
        next(err);
      });
  }
});

module.exports = router;
