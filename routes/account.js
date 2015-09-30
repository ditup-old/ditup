'use strict';

var express = require('express');
var router = express.Router();
var accountModule = require('../modules/account');


router.get('/verify-email/:username/:code', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  var code = req.params.code;
  
  var verifyData ={username: username, code: code};
  return accountModule.verifyEmail(verifyData)
    .then(function () {
      res.render('sysinfo', {msg: 'verification successful', session: sessUser});
    })
    .then(null, function (err) {
      console.log(err.stack);
      next(err);
    });
});

module.exports = router;
