'use strict';

var Q = require('q');
var express = require('express');
var router = express.Router();
var database = require('../services/data');
var process = require('../services/processing');
var validate = require('../services/validation');

router.get('/', function (req, res, next) {
  return res.redirect('/users');
});


//check login for all
router.all(['/:username', '/:username/*'], function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    next();
  }
  else {
    var err = new Error('you need to log in to continue');
    next(err);
  }
});

router.get('/:username', function (req, res, next) {
  var username = req.params.username;
  var sessUser = req.session.user;

  var user, rights;

  //read user
  database.readUser({username: username})
    .then(function (_user) {
      user = _user;
      return myRightsToUser(sessUser, _user);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.view !== true) throw new Error('you don\'t have rights to see user');
      return process.user.profile(user);
    })
    .then(function (profile) {
      return res.render('user-profile', {profile: profile, rights: rights, session: sessUser});
    })
    .then(null, function (err) {
      next(err);
    });

});

router.get('/:username/edit', function (req, res, next) {
  var username = req.params.username;
  var sessUser = req.session.user;

  var user, rights;

  //read user
  database.readUser({username: username})
    .then(function (_user) {
      user = _user;
      return myRightsToUser(sessUser, _user);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.edit !== true) throw new Error('you don\'t have rights to edit user');
      return process.user.profileEdit(user);
    })
    .then(function (profile) {
      return res.render('user-profile-edit', {profile: profile, errors: {}, rights: rights, session: sessUser});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post('/:username/edit', function (req, res, next){
  var username = req.params.username;
  var sessUser = req.session.user;

  var user, rights;
  var profile = {};
  var errors = {};
  console.log('***************************************************************', username)
  database.readUser({username: username})
    .then(function (_user){
      user = _user;
      return myRightsToUser(sessUser, user);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.edit !== true){
        throw new Error('you don\'t have rights to edit user ' + username + '. you probably need to be logged in as this user.');
      }

      var form = req.body;
      var profileForm = {
        birthday: form.birthday,
        gender: form.gender,
        name: form.name,
        surname: form.surname,
        about: form.about,
      };
      return validate.user.profile(profileForm, errors, profile);
    })
    .then(function (valid) {
      if(valid !== true) throw new Error('invalid');
      return database.updateUserProfile({username: username}, profile);
    })
    .then(function () {
      return res.redirect('/user/' + username);
    })
    .then(null, function (err) {
      if(err.message === 'invalid'){
        return res.render('user-profile-edit', {profile: profile, errors: errors, rights: rights, session: sessUser});
      }
      next(err);
    });
});

router.get('/:username/dits', function (req, res, next) {
  //find user and check if i can see her.
  //collect her dits (if it's me, join and accepted too, otherwise just member/admin). (let's sort this in database? or here?)
  //end request by rendering page with dits
  //(rendered page if belongs to me, will have option to manage my membership)

  
  var username = req.params.username;
  var sessUser = req.session.user;

  var user, rights;

  //read user
  database.readUser({username: username})
    .then(function (_user) {
      user = _user;
      if(_user === null) throw (new Error('user not found')).status(404);
      //check if i can see her.
      return myRightsToUser(sessUser, _user);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.view !== true) throw new Error('you don\'t have rights to see user');
      //return process.user.profile(user);
      if(username === sessUser.username) return database.readDitsOfUser({username: username});
      else return database.readDitsOfUser({username: username}, ['member', 'admin']);
    })
    .then(function (dits) {
      //dits are object {dit: dit, relation: relation}
      return res.render('user-dits', {user: user, dits: dits, rights: rights, session: sessUser});
    })
    .then(null, function (err) {
      next(err);
    });
});

//check if i can see & change settings of user (basically: is it me?)
router.all('/:username/settings', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  
  if(sessUser.username === username) {
    return next();
  }

  return next(new Error('you cannot view & change settings of user'));
});

router.get('/:username/settings', function (req, res, next) {
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
      return process.user.settings(user);
    })
    .then(function (_data) {
      //render the settings page
      res.render('user-settings', {data: _data, errors: {}, session: sessUser});
    })
    .then(null, function (err) {
      next(err);
    });
});


//depends on router.all which checks the rights. this one is allowed only after checking those rights
router.post('/:username/settings', function (req, res, next) {
  var sessUser = req.session.user;

  var username = req.params.username;
  var form = {
    view: req.body.view
  };

  var errors = {};
  var values = {};

  return Q.resolve(validate.user.settings(form, errors, values))
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
        return res.render('sysinfo', {msg: '<a href="" >settings</a> of <a href="/user/' + username + '" >' + username + '</a> were successfully updated', session: sessUser});
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
        return process.user.settings(user);
      })
      .then(function (_data) {
        _data.settings = values;
        //render the settings page
        res.render('user-settings', {data: _data, errors: errors, session: sessUser});
      })
      .then(null, function (err) {
        next(err);
      });
  }
});

module.exports = router;

function myRightsToUser(me, user) {
  //TODO involve user settings
  var amILogged = me.logged === true ? true : false;
  var isItMe = me.logged === true && me.username === user.username;
  var canIView = amILogged;
  var canIEdit = isItMe;

  return ({
    view: canIView,
    edit: canIEdit
  });
};

