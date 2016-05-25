'use strict';

var express = require('express');
var router = express.Router();
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var validate = require('../services/validation');
var db = require('../services/data');

const MAX_POST_LENGTH = 16384;

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
      return db.discussion.addPost(id, {text: text , creator:sessUser.username})
        .then(function () {
          sessUser.messages.push('post successfuly added');
          return next();
        }, function (err) {
          console.log(err);
          return next(err);
        });
    }
    else {
      let err = new Error('we don\'t know what to do with this POST request');
      return next(err);
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

  req.ditup.discussion = req.ditup.discussion || {};
  var discussion, expectedUrl;

  return db.discussion.read(id)
    .then(function (_discussion) {
      discussion = _discussion;
      expectedUrl = generateUrl(discussion.topic);
      discussion.url = expectedUrl;
      discussion.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying
      discussion.id = id;
      //copying params from previous routes
      for(var param in req.ditup.discussion) {
        discussion[param] = req.ditup.discussion[param];
      }
      return;
    })
    //read tags of discussion
    .then(function () {
      return db.discussion.tags(id)
        .then(function (_tags) {
          discussion.tags = [];
          for(let _tag of _tags) {
            discussion.tags.push(_tag.name);
          }
          return;
        });
    })
    //sending the response
    .then(function () {
      if(expectedUrl === url) {
        if(sessUser.logged !== true) {
          sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> or <a href="/signup">sign up</a> to read more and contribute');
        }
        return res.render('discussion', {session: sessUser, discussion: discussion});
      }
      else {
        return res.redirect('/discussion/' + id + '/' + expectedUrl );
      }
    })
    .then(null, next);
  /*
  return db.discussion.read(id)
    .then(function (discussion) {
      var expectedUrl = generateUrl(discussion.topic);
      discussion.url = expectedUrl;
      discussion.id = id;
      for(var param in req.ditup.discussion) {
        discussion[param] = req.ditup.discussion[param];
      }
      if(expectedUrl === url) {
        return res.render('discussion', {session: sessUser, discussion: discussion});
      }
      else {
        return res.redirect('/discussion/' + id + '/' + expectedUrl );
      }
    })
    .then(null, next);
  */
});


module.exports = router;
