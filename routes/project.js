'use strict';

var express = require('express');
var router = express.Router();

router.all(['/:id/:url', '/:id'], function (req, res, next) {
  res.end(req.url);
});

module.exports = router;
