'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.end('TODO show list of message threads with users');
});

router.get('/:username', function(req, res, next) {
  let username = req.params.username;
  res.end('TODO show list of messages from user ' + username);
});

router.post('/:username', function(req, res, next) {
  let username = req.params.username;
  res.end('TODO send message to user ' + username);
});

module.exports = router;
