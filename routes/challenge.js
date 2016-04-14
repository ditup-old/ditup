'use strict';

var express = require('express');
//var entities = require('entities');
var router = express.Router();
//var validate = require('../services/validation');
var db = require('../services/data');

router.get('/new', function (req, res, next) {
  res.end('hello!');
});

module.exports = router;
