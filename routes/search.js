'use strict';

var express = require('express');
var router = express.Router();
var database = require('../services/data');
var validate = require('../services/validation');


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

  if(submit ==='dits with my tags') return database.search.ditsWithTagsOfUser({username: sessUser.username})
    .then(function (results) {
      return res.format({
        'text/html': function () {
          return res.render('dits-with-my-tags', {data: results, session: sessUser})
        },
        'application/json': function () {
          return res.send(results);
        }
      });
    })
    .then(null, function (err) {
      return next(err);
    });

  if(submit ==='dits with tags') {
    let tagInput = req.body.tagnames;
    let rawTagnames = tagInput.replace(/\s*,?\s*$/,'').split(/\s*,\s*|\s+/);
    let tagnames = [];
    for(let raw of rawTagnames){
      let valid = validate.tag.name(raw);
      if(valid === true) tagnames.push(raw);
    }

    return database.search.ditsWithTags(tagnames)
      .then(function (results) {
        return res.format({
          'text/html': function () {
            return res.render('dits-with-my-tags', {data: results, session: sessUser})
          },
          'application/json': function () {
            return res.send(results);
          }
        });
      })
      .then(null, function (err) {
        return next(err);
      });
  }

  if(submit ==='users with tags') {
    let tagInput = req.body.tagnames;
    let rawTagnames = tagInput.replace(/\s*,?\s*$/,'').split(/\s*,\s*|\s+/);
    let tagnames = [];
    for(let raw of rawTagnames){
      let valid = validate.tag.name(raw);
      if(valid === true) tagnames.push(raw);
    }

    return database.search.usersWithTags(tagnames)
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
  }
});

module.exports = router;
