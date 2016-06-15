'use strict';

var express = require('express');
var router = express.Router();

var db = require('../services/data');
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var postHideFollow = require('./partial/post-hide-follow');
var joinRouter = require('./project/join');

//redirect to the correct address
router.get(['/:id', '/:id/:url','/:id/:url/*', '/:id/*'], function (req, res, next) {
  if(req.baseUrl.length === 2) {
    return next(); //if short address, no redirect.
  }

  var id = req.params.id;
  var url = req.params.url;
  var project = req.ditup.project = req.ditup.project || {};
  var project, expectedUrl;

//first reading the project
  return db.project.read(id)
    .then(function (_project) {
      for(let p in _project) {
        project[p] = _project[p];
      }

      expectedUrl = generateUrl(project.name);

      //redirect to the correct url
      if(expectedUrl !== url) {
        let urlPieces = req.originalUrl.split('/');
        urlPieces[3] = expectedUrl;
        let redirectUrl = urlPieces.join('/');
        return res.redirect(redirectUrl);
      }

      project.url = expectedUrl;
      project.link = req.protocol + '://' + req.headers.host+req.originalUrl; //this is a link for users for copying
      project.id = id;
      return next();
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.use(postHideFollow('project', {router: express.Router(), db: db }));
router.use(joinRouter({router: express.Router(), db: db}));


router.all(['/:id/:url', '/:id'], function (req, res, next) {
  var sessUser = req.session.user;

  var id = req.params.id;
  var url = req.params.url;
  req.ditup.project = req.ditup.project || {};
  var project, expectedUrl;

//first reading the project

  let getProject;

  //if we already got project from database in previous route, let's not repeat.
  if(req.ditup && req.ditup.project && req.ditup.project.url) {
    getProject = Promise.resolve();
    project = req.ditup.project;
  }
  else {
    getProject = db.project.read(id)
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
      });
  }
    //********reading user status in project
  getProject
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
      return next(err);
    });
});


module.exports = router;
