'use strict';

var express = require('express');
var router = express.Router();
var database = require('../services/data');

/* GET home page. */
router.get('/', function(req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    return Promise.all([database.user.count(), database.dit.count(), database.tag.count()])
      .then(function (results) {
        var data = {};
        data.userno = results[0].count;
        data.ditno = results[1].all;
        data.dittypeno = {
          dit: results[1].dit || 0,
          idea: results[1].idea || 0,
          challenge: results[1].challenge || 0,
          project: results[1].project || 0,
          interest: results[1].interest || 0
        };
        data.tagno = results[2].tagno;
        data.usertagno = results[2].usertagno;
        data.dittagno = results[2].dittagno;
      
        return res.render('main-logged', {data: data, session: sessUser, user: sessUser});
      })
      .then(null, function (err) {
        return next(err);
      });
  }
  else {
    return res.render('main');
  }
});

module.exports = router;
