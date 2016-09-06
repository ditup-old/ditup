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

let showCollection = require('./collection/showCollection');

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
    return next();
  }
});

router.all(['/:id/:url', '/:id'], showCollection);

module.exports = router;
