'use strict';

var express = require('express');
var co = require('co');
var router = express.Router();
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var validate = require('../services/validation');
var db = require('../services/data');
var editRoute = require('./discussion/edit');

var postHideFollow = require('./partial/post-hide-follow');

const MAX_POST_LENGTH = 16384;

router.use(editRoute);
router.use(postHideFollow('discussion', {}));

router.post('/:id/:url', function (req, res, next) {
  var sessUser = req.session.user;
  var id = req.params.id;
  var url = req.params.url;
  if(sessUser.logged === true) {
    if(req.body.submit === 'add tag') {
      let tagname = req.body.tagname;
      return db.discussion.addTag(id, tagname, sessUser.username)
        .then(function () {
          sessUser.messages.push('Tag <a href="/tag/' + tagname + '">' + tagname + '</a> was successfully added to the discussion.');
          return next();
        })
        .then(null, next);
    }
    else if(req.body.submit === 'post') {
      let text = req.body.text;
      if(!text) {
        req.ditup.discussion = {newPost: {errors: ['error: the message is empty']}};
        return next();

      }
      if(text.length > 16384) {
        req.ditup.discussion = {newPost: {errors: ['error: the message is too long']}};
        return next();
      }
      return db.discussion.addPost(id, {text: text}, sessUser.username)
        .then(function () {
          sessUser.messages.push('post successfuly added');
          return next();
        }, function (err) {
          console.log(err);
          return next(err);
        });
    }
    else return next();
  }
  else {
    sessUser.messages.push('You need to <a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> to POST anything');
    next();
  }
});

router.all(['/:id/:url', '/:id'], function (req, res, next) {
  return co(function * () {
    var sessUser = req.session.user;
    var id = req.params.id;
    var url = req.params.url;

    req.ditup.discussion = req.ditup.discussion || {};
    var expectedUrl;

    let discussion = yield db.discussion.read(id)
    expectedUrl = generateUrl(discussion.name);
    discussion.url = expectedUrl;
    discussion.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying
    discussion.id = id;
    //copying params from previous routes
    for(var param in req.ditup.discussion) {
      discussion[param] = req.ditup.discussion[param];
    }

    //read posts of discussion
    let posts = yield db.discussion.readPosts(id)
    discussion.posts = [];
    for(let post of posts) {
      discussion.posts.push(post);
    }
    //read tags of discussion
    let tags = yield db.discussion.tags(id)
    discussion.tags = [];
    for(let tag of tags) {
      discussion.tags.push(tag.name);
    }
    //find out whether user follows the discussion
    if(sessUser.logged === true) {
      discussion.following = yield db.discussion.followingUser(id, sessUser.username)
    }
    //sending the response
    if(expectedUrl === url) {
      if(sessUser.logged !== true) {
        sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> or <a href="/signup">sign up</a> to read more and contribute');
      }
      return res.render('discussion', {session: sessUser, discussion: discussion});
    }
    else {
      return res.redirect('/discussion/' + id + '/' + expectedUrl );
    }
  }).catch(next);
});


module.exports = router;
