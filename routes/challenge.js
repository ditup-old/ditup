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
  if(req.body.submit === 'add tag') {
    let tagname = req.body.tagname;
    return db.challenge.addTag(id, tagname, sessUser.username)
      .then(function () {
        sessUser.messages.push('Tag <a href="/tag/' + tagname + '">' + tagname + '</a> was successfully added to the challenge.');
        next();
      })
      .then(null, next);
  }
  else {
    let err = new Error('we don\'t know what to do with this POST request');
    next(err);
  }
});

router.all(['/:id/:url', '/:id'], function (req, res, next) {
  var sessUser = req.session.user;

  var id = req.params.id;
  var url = req.params.url;
  req.ditup.challenge = req.ditup.challenge || {};
  var challenge, expectedUrl;

  return db.challenge.read(id)
    .then(function (_challenge) {
      challenge = _challenge;
      //console.log(challenge);
      expectedUrl = generateUrl(challenge.name);
      challenge.url = expectedUrl;
      //console.log(req);
      challenge.link = 'http://'+req.headers.host+req.originalUrl;
      challenge.id = id;
      for(var param in req.ditup.challenge) {
        challenge[param] = req.ditup.challenge[param];
      }

      //read tags of challenge
      return db.challenge.tags(id);
    })
    .then(function (_tags) {
      //console.log('**************', _tags);
      challenge.tags = [];
      for(let _tag of _tags) {
        challenge.tags.push(_tag.name);
      }
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
