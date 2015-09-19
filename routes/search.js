'use strict';

var express = require('express');
var router = express.Router();

router.all('*', function(req, res, next) {
  var err = new Error('TODO router for ' + req.originalUrl);
  err.status = 404;
  next(err);
});

module.exports = router;
