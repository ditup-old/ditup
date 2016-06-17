'use strict';

var co = require('co');
var express = require('express');
var router = express.Router();

var db = require('../services/data');
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var postHideFollow = require('./partial/post-hide-follow');
var joinRouter = require('./project/join');


//first the post, to get the updated data already when querying database for the project
router.use(postHideFollow('project', {router: express.Router(), db: db }));

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

  return co(function *() {
    let pr = yield db.project.read(id);

    for(let p in pr) {
      project[p] = pr[p];
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
  .catch(function (err) {
    return next(err);
  });
});

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
  return co(function *() {
    yield getProject;

    if(sessUser.logged === true) {
      let involvement = yield db.project.userStatus(id, sessUser.username);
      project.userStatus = (['member', 'joining', 'invited'].indexOf(involvement)>-1) ? involvement : '';
      //show a message that user was invited when invited
      if(project.userStatus === 'invited') {
        sessUser.messages.push('you were invited to join the project');
      }
    }

    //read number of followers
    project.followerno = yield db.project.countFollowers(id);
    //********reading number of members
    project.memberno = yield db.project.countMembers(id, 'member');
    //********reading tags
    project.tags = yield db.project.tags(id);
    //if user is logged in, find out whether she follows the project
    if(sessUser.logged === true) {
      project.following = yield db.project.followingUser(id, sessUser.username);
      //if user is logged in, find out whether she hides the project
      project.hiding = yield db.project.followingUser(id, sessUser.username, true);
    }
    //sending the response
    if(sessUser.logged !== true) {
      sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> or <a href="/signup">sign up</a> to read more and contribute');
    }

    return res.render('project', {session: sessUser, project: project});
  })
  .catch(function (err) {
    next(err);
  });
});


module.exports = router;
