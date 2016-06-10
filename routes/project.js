'use strict';

var express = require('express');
var router = express.Router();

var db = require('../services/data');
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var postHideFollow = require('./partial/post-hide-follow');

router.use(postHideFollow('project', {router: express.Router(), db: db }));


router.all(['/:id/:url', '/:id'], function (req, res, next) {
  var sessUser = req.session.user;

  var id = req.params.id;
  var url = req.params.url;
  req.ditup.project = req.ditup.project || {};
  var project, expectedUrl;

//first reading the project
  return db.project.read(id)
    .then(function (_project) {
      project = _project;
      expectedUrl = generateUrl(project.name);
      if(expectedUrl !== url) throw new Error('wrong url');
      project.url = expectedUrl;
      project.link = req.protocol + '://' + req.headers.host+req.originalUrl; //this is a link for users for copying
      project.id = id;
      //copying params from previous routes
      for(var param in req.ditup.project) {
        project[param] = req.ditup.project[param];
      }
      return;
    })
    //********reading user status in project
    .then(function () {
      if(sessUser.logged === true) {
        return db.project.userStatus(id, sessUser.username);
      }
      return '';
    })
    .then(function (_status) {
      project.userStatus = (['member', 'joining', 'invited'].indexOf(_status)>-1) ? _status : '';
      return;
    })
    //**********END
    //********reading number of followers
    .then(function () {
      return db.project.countFollowers(id);
    })
    .then(function (fno) {
      project.followerno = fno;
    })
    //**********END
    //********reading number of members
    .then(function () {
      return db.project.countMembers(id, 'member');
    })
    .then(function (mno) {
      project.memberno = mno;
    })
    //**********END
    //********reading tags
    .then(function () {
      return db.project.tags(id);
    })
    .then(function (_tags) {
      project.tags = _tags;
    })
    //**********END
    //if user is logged in, find out whether she follows the project
    .then(function () {
      if(sessUser.logged === true) {
        return db.project.followingUser(id, sessUser.username)
          .then(function(_flwng) {
            project.following = _flwng;
            return;
          });
      }
      else {
        return;
      }
    })
    //if user is logged in, find out whether she hides the project
    .then(function () {
      if(sessUser.logged === true) {
        return db.project.followingUser(id, sessUser.username, true)
          .then(function(_hdng) {
            project.hiding = _hdng;
            return;
          });
      }
      else {
        return;
      }
    })

    //sending the response
    .then(function () {
      if(sessUser.logged !== true) {
        sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> or <a href="/signup">sign up</a> to read more and contribute');
      }
      return res.render('project', {session: sessUser, project: project});
    })
    .then(null, function (err) {
      if(err.message === 'wrong url') {
        return res.redirect('/project/' + id + '/' + expectedUrl );
      }
      return next(err);
    });
});


module.exports = router;
