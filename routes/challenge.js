'use strict';

var express = require('express');
//var entities = require('entities');
var router = express.Router();
//var validate = require('../services/validation');
var db = require('../services/data');
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

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
    else if(req.body.submit === 'follow') {
      //return next();
      return db.challenge.follow(id, sessUser.username)
        .then(function () {
          sessUser.messages.push('Now you follow the challenge.');
          return next();
        })
        .then(null, next);
    }
    else if(req.body.submit === 'unfollow') {
      //return next();
      return db.challenge.unfollow(id, sessUser.username)
        .then(function () {
          sessUser.messages.push('You don\'t follow the challenge anymore.');
          return next();
        })
        .then(null, next);
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
  req.ditup.challenge = req.ditup.challenge || {};
  var challenge, expectedUrl;

//first reading the challenge
  return db.challenge.read(id)
    .then(function (_challenge) {
      challenge = _challenge;
      expectedUrl = generateUrl(challenge.name);
      challenge.url = expectedUrl;
      challenge.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying
      challenge.id = id;
      //copying params from previous routes
      for(var param in req.ditup.challenge) {
        challenge[param] = req.ditup.challenge[param];
      }
      return;
    })
    //read tags of challenge
    .then(function () {
      return db.challenge.tags(id)
        .then(function (_tags) {
          challenge.tags = [];
          for(let _tag of _tags) {
            challenge.tags.push(_tag.name);
          }
          return;
        });
    })
    //if user is logged in, find out whether she follows the challenge
    .then(function () {
      if(sessUser.logged === true) {
        return db.challenge.followingUser(id, sessUser.username)
          .then(function(_flwng) {
            challenge.following = _flwng;
            return;
          });
      }
      else {
        return;
      }
    })
    //if user is logged in, find out whether she hides the challenge
    .then(function () {
      if(sessUser.logged === true) {
        return db.challenge.followingUser(id, sessUser.username, true)
          .then(function(_hdng) {
            challenge.hiding = _hdng;
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
        return res.render('challenge', {session: sessUser, challenge: challenge});
      }
      else {
        return res.redirect('/challenge/' + id + '/' + expectedUrl );
      }
    })
    .then(null, next);
});

module.exports = router;
