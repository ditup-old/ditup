'use strict';

var fs = require('fs');
var express = require('express');
var router = express.Router();
var processing = require('../services/processing');
var validate = require('../services/validation');
var image = require('../services/image');

let co = require('co');

router.use(require('./user/edit'));
router.use(require('./user/settings'));

router
.post('/:username', function (req, res, next){
  return co(function * () {
    let sessUser = req.session.user;
    let username = req.params.username;

    let db = req.app.get('database');
    let action = req.body.action;
    
    //follow or unfollow user
    if(req.body.action === 'follow') {
      yield db.user.follow(sessUser.username, username);
      return next();
    }
    else if(req.body.action === 'unfollow') {
      yield db.user.unfollow(sessUser.username, username);
      return next();
    }
    else{
      throw new Error('post not recognized');
    }
  })
    .catch(next);
})
.all('/:username', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    var username = req.params.username;
    var sessUser = req.session.user;

    //read user
    let user = yield db.user.read({username: username});
    let profile;

    if(sessUser.logged) {
      profile = yield processing.user.profile(user);
    }
    else {
      profile = {username: username};
      sessUser.messages.push('log in to see more');
    }
    
    //show number of followers
    if(sessUser.logged === true) {
      profile.followers = yield db.user.countFollowers(username);
    }
    
    //find out whether logged user is following this user
    if(sessUser.logged === true && sessUser.username !== username) {
      profile.following = yield db.user.following(sessUser.username, username);
    }
    
    res.locals.profile = profile;
    res.locals.tags = yield db.user.tags(username);

    return res.render('user-profile');
  })
    .catch(next);
});

module.exports = router;
/*
var routeUserProjects = require('./user/projects');
var routeUserCollections = require('./user/collections');

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

//router for /user/[username]/projects
router.use(routeUserProjects());
router.use(routeUserCollections('idea'));
router.use(routeUserCollections('challenge'));
router.use(routeUserCollections('discussion'));

router
.post('/:username', function (req, res, next){
  return co(function * () {
    let sessUser = req.session.user;
    let username = req.params.username;

    let db = req.app.get('database');
    let action = req.body.action;
    
    //follow or unfollow user
    if(req.body.action === 'follow') {
      yield db.user.follow(sessUser.username, username);
      next();
    }
    else if(req.body.action === 'unfollow') {
      yield db.user.unfollow(sessUser.username, username);
      next();
    }
    else{
      throw new Error('post not recognized');
    }
  })
    .catch(next);
})
.all('/:username', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    var username = req.params.username;
    var sessUser = req.session.user;

    //read user
    let user = yield db.user.read({username: username});
    let rights = yield myRightsToUser(sessUser, user);

    if(rights.view !== true) throw new Error('you don\'t have rights to see user');

    let profile = yield processing.user.profile(user);
    if(sessUser.logged === true && sessUser.username !== username) {
      profile.following = yield db.user.following(sessUser.username, username);
    }
    
    res.locals.tags = yield db.user.tags(username);

    return res.render('user-profile', {profile: profile, rights: rights});
  })
    .catch(next);
});

// */
//
//when user doesn't exist, this function will return the default profile picture. not error.
router.get('/:username/avatar', function (req, res, next) {
  return co(function * () {
    let database = req.app.get('database');

    var username = req.params.username;
    var sessUser = req.session.user;

    //read the avatar
    let img = yield image.avatar.read(username);

    res.writeHead(200, {'Content-Type': img.type});
    return res.end(img.data); // Send the file data to the browser.
  })
    .catch(next);
});

/*



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
// */
