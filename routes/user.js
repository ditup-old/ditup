'use strict';

var express = require('express');
var router = express.Router();
var database = require('../services/data');
var process = require('../services/processing');
var validate = require('../services/validation');

router.get('/', function (req, res, next) {
  return res.redirect('/users');
});

router.get('/:username', function (req, res, next) {
  var username = req.params.username;
  var sessUser = req.session.user;

  var user, rights;

  if(sessUser.logged !== true) throw new Error('you have to <a href="/login">log in</a> to continue');

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

  if(sessUser.logged !== true) throw new Error('you have to <a href="/login">log in</a> to continue');

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

