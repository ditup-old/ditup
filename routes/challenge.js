'use strict';

var express = require('express');
var co = require('co');
//var entities = require('entities');
var router = express.Router();
//var validate = require('../services/validation');
var db = require('../services/data');
var functions = require('./collection/functions');
var generateUrl = functions.generateUrl;
var editRoute = require('./challenge/edit');
var postFollowRoute = require('./partial/post-hide-follow');

router.use(editRoute);
router.use(postFollowRoute('challenge'));

router.post(['/:id/:url'], function (req, res, next) {
  let sessUser = req.session.user;
  let id = req.params.id;
  if(sessUser.logged === true) {
    if(req.body.submit === 'add tag') {
      let tagname = req.body.tagname;
      return db.challenge.addTag(id, tagname, sessUser.username)
        .then(function () {
          sessUser.messages.push('Tag <a href="/tag/' + tagname + '">' + tagname + '</a> was successfully added to the challenge.');
          return next();
        })
        .then(null, next);
    }
    else if(req.body.submit === 'comment') {
      let text = req.body.comment;
      return db.challenge.addComment(id, {text: text}, sessUser.username)
        .then(function () {
          sessUser.messages.push('The comment was successfully added to the challenge.');
          return next();
        })
        .then(null, next);
    }
    //removing comment
    else if(req.body.submit === 'remove comment') {
      let commentId = req.body['comment-id'];
      return db.challenge.removeComment(commentId, {author: sessUser.username, id: id})
        .then(function () {
          sessUser.messages.push('The comment was successfully removed.');
          return next();
        })
        .then(null, next);
    }
    else {
      return next();
    }
  }
  else {
    sessUser.messages.push('You need to <a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> to POST anything');
    next();
  }
});

router.all(['/:id/:url', '/:id'], function (req, res, next) {
  var sessUser = req.session.user;

  var id = req.params.id;
  var url = req.params.url;
  req.ditup.challenge = req.ditup.challenge || {};

  return co(function *() {
    //read the challenge
    var challenge = yield db.challenge.read(id);
    var expectedUrl = generateUrl(challenge.name);
    challenge.url = expectedUrl;
    challenge.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying
    challenge.id = id;

    //copying params from previous routes
    for(var param in req.ditup.challenge) {
      challenge[param] = req.ditup.challenge[param];
    }

    //read tags of challenge
    let tags = yield db.challenge.tags(id);
    challenge.tags = [];
    for(let tag of tags) {
      challenge.tags.push(tag.name);
    }

    //read comments of challenge
    challenge.comments = yield db.challenge.readComments(id);

    //if user is logged in, find out whether she follows the challenge
    if(sessUser.logged === true) {
      challenge.following = yield db.challenge.followingUser(id, sessUser.username);
      
      //find out whether she hides the challenge
      challenge.hiding = db.challenge.followingUser(id, sessUser.username, true);
    }

    //sending the response
    if(expectedUrl === url) {
      if(sessUser.logged !== true) {
        sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> or <a href="/signup">sign up</a> to read more and contribute');
      }
      return res.render('challenge', {session: sessUser, challenge: challenge});
    }
    else {
      return res.redirect('/challenge/' + id + '/' + expectedUrl );
    }
  })
    .catch(next);

});

module.exports = router;
