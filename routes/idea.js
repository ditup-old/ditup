'use strict';

var express = require('express');
//var entities = require('entities');
var router = express.Router();
//var validate = require('../services/validation');
var db = require('../services/data');
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var postHideFollow = require('./partial/post-hide-follow');

var editRoute = require('./idea/edit');

router.use(editRoute);

router.use(postHideFollow('idea', {}));

router.post(['/:id/:url'], function (req, res, next) {
  let sessUser = req.session.user;
  let id = req.params.id;
  if(sessUser.logged === true) {
    if(req.body.submit === 'add tag') {
      let tagname = req.body.tagname;
      return db.idea.addTag(id, tagname, sessUser.username)
        .then(function () {
          sessUser.messages.push('Tag <a href="/tag/' + tagname + '">' + tagname + '</a> was successfully added to the idea.');
          return next();
        })
        .then(null, next);
    }
    else if(req.body.submit === 'comment') {
      let text = req.body.comment;
      return db.idea.addComment(id, {text: text}, sessUser.username)
        .then(function () {
          sessUser.messages.push('The comment was successfully added to the idea.');
          return next();
        })
        .then(null, next);
    }
    //removing comment
    else if(req.body.submit === 'remove comment') {
      let commentId = req.body['comment-id'];
      return db.idea.removeComment(commentId, {author: sessUser.username, id: id})
        .then(function () {
          sessUser.messages.push('The comment was successfully removed.');
          return next();
        })
        .then(null, next);
    }
    else{
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
  req.ditup.idea = req.ditup.idea || {};
  var idea, expectedUrl;

//first reading the idea
  return db.idea.read(id)
    .then(function (_idea) {
      idea = _idea;
      expectedUrl = generateUrl(idea.name);
      idea.url = expectedUrl;
      idea.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying
      idea.id = id;
      //copying params from previous routes
      for(var param in req.ditup.idea) {
        idea[param] = req.ditup.idea[param];
      }
      return;
    })
    //read tags of idea
    .then(function () {
      return db.idea.tags(id)
        .then(function (_tags) {
          idea.tags = [];
          for(let _tag of _tags) {
            idea.tags.push(_tag.name);
          }
          return;
        });
    })
    //read comments of idea
    .then(function () {
      return db.idea.readComments(id)
        .then(function (_coms) {
          idea.comments = [];
          for(let co of _coms) {
            idea.comments.push(co);
          }
          return;
        });
    })
    //if user is logged in, find out whether she follows the idea
    .then(function () {
      if(sessUser.logged === true) {
        return db.idea.followingUser(id, sessUser.username)
          .then(function(_flwng) {
            idea.following = _flwng;
            return;
          });
      }
      else {
        return;
      }
    })
    //if user is logged in, find out whether she hides the idea
    .then(function () {
      if(sessUser.logged === true) {
        return db.idea.followingUser(id, sessUser.username, true)
          .then(function(_hdng) {
            idea.hiding = _hdng;
            return;
          });
      }
      else {
        return;
      }
    })
    //sending the response
    .then(function () {
      if(expectedUrl === url) {
        if(sessUser.logged !== true) {
          sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> or <a href="/signup">sign up</a> to read more and contribute');
        }
        return res.render('idea', {session: sessUser, idea: idea});
      }
      else {
        return res.redirect('/idea/' + id + '/' + expectedUrl );
      }
    })
    .then(null, next);
});

module.exports = router;
