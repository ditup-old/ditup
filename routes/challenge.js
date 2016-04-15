'use strict';

var express = require('express');
//var entities = require('entities');
var router = express.Router();
//var validate = require('../services/validation');
var db = require('../services/data');

router.get(['/:id/:url', '/:id'], function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('challenge', {session: sessUser, challenge: {name: ''}});
});

module.exports = router;
