'use strict';

var express = require('express');
//var entities = require('entities');
var router = express.Router();
//var validate = require('../services/validation');
var db = require('../services/data');
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

router.all(['/:id/:url', '/:id'], function (req, res, next) {
  var sessUser = req.session.user;
  var id = req.params.id;
  var url = req.params.url;
  req.ditup.challenge = req.ditup.challenge || {};

  return db.challenge.read(id)
    .then(function (challenge) {
      //console.log(challenge);
      var expectedUrl = generateUrl(challenge.name);
      challenge.url = expectedUrl;
      console.log(req);
      challenge.link = 'http://'+req.headers.host+req.originalUrl;
      challenge.id = id;
      for(var param in req.ditup.challenge) {
        challenge[param] = req.ditup.challenge[param];
      }
      if(expectedUrl === url) {
        return res.render('challenge', {session: sessUser, challenge: challenge});
      }
      else {
        return res.redirect('/challenge/' + id + '/' + expectedUrl );
      }
    })
    .then(null, next);
});

module.exports = router;
