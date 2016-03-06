'use strict';

var express = require('express');
var router = express.Router();
var functions = require('./discussion/functions');
var generateUrl = functions.generateUrl;

var validate = require('../services/validation');
var db = require('../services/data');

router.get('/:id/:url', function (req, res, next) {
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
