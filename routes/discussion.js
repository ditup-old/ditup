'use strict';

var express = require('express');
var router = express.Router();
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var validate = require('../services/validation');
var db = require('../services/data');

router.post('/:id/:url', function (req, res, next) {
  var sessUser = req.session.user;
  var id = req.params.id;
  var url = req.params.url;
  var text = req.body.text;
  console.log(text, '^^^^^^^^^^^^^6', id, url);
  if(sessUser.logged === true) {
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
    sessUser.messages.push('you don\'t have rights to add a post to the discussion. Try to <a href="/login?redirect='+encodeURIComponent(url)+'">log in</a>');
    next();
  }
});

router.all('/:id/:url', function (req, res, next) {
  var sessUser = req.session.user;
  var id = req.params.id;
  var url = req.params.url;

  return db.discussion.read(id)
    .then(function (discussion) {
      //console.log(discussion);
      var expectedUrl = generateUrl(discussion.topic);
      discussion.url = expectedUrl;
      discussion.id = id;
      if(expectedUrl === url) {
        return res.render('discussion', {session: sessUser, discussion: discussion});
      }
      else {
        return res.redirect('/discussion/' + id + '/' + expectedUrl );
      }
    })
    .then(null, next);
});


module.exports = router;
