'use strict';

var express = require('express');
var router = express.Router();
var database = require('../services/data');

router.all('*', function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) return next();
  var err = new Error('not logged in');
  throw err;
  //return next(err);
});

router.get('/', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('search', {session: sessUser});
});

router.post('/', function (req, res, next) {
  var sessUser = req.session.user;
  var submit = req.body.search;

  if(submit ==='users with my tags') return database.search.usersWithTagsOfUser({username: sessUser.username})
    .then(function (results) {
      return res.format({
        'text/html': function () {
          return res.render('users-with-my-tags', {data: results, session: sessUser})
        },
        'application/json': function () {
          return res.send(results);
        }
      });
    })
    .then(null, function (err) {
      return next(err);
    });
});

module.exports = router;
