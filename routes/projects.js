'use strict';

var express = require('express');
var router = express.Router();

router.get(['/', '/new'], function (req, res, next) {
  return res.end();
});

module.exports = router;
