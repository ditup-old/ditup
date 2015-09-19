'use strict';

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    return res.render('main-logged', {user: sessUser});
  }
  else {
    return res.render('main');
  }
});

module.exports = router;
