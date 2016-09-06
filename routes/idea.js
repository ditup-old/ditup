'use strict';

var router = require('express').Router();

var showCollection = require('./collection/showCollection');
var postCollection = require('./collection/post');

var postHideFollow = require('./partial/post-hide-follow');
var editRoute = require('./idea/edit');

router.use(editRoute);

router.use(postHideFollow('idea', {}));

router.post(['/:id/:url'], function (req, res, next) {
  let sessUser = req.session.user;
  let id = req.params.id;
  if(sessUser.logged === true) {
    if(req.body.submit === 'comment') {
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

router.all(['/:id/:url', '/:id'], showCollection);

module.exports = router;
