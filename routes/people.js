'use strict';

var express = require('express');
var router = express.Router();

router.all('/', function(req, res, next) {
  res.end('TODO people');
});

module.exports = router;
