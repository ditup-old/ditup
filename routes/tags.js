'use strict';

var Q = require('q');
var express = require('express');
var router = express.Router();

var database = require('../services/data');
var validate = require('../services/validation');

router.get('/', function (req, res, next) {
  var sessUser = req.session.user;
  res.render('tags', {session: sessUser});
});

router.all('/create', function (req, res, next) {
  //at this moment any logged in user can create tag.
  var sessUser = req.session.user;
  if(sessUser.logged === true) return next();
  var err = new Error('you need to be logged in to create a tag');
  return next(err);
});

router.get('/create', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('tags-create', {errors: {}, data: {}, session: sessUser});
});

router.post('/create', function (req, res, next) {
  var sessUser = req.session.user;

  var data = {
    name: req.body.name,
    description: req.body.description
  };
  
  var errors = {};
  var values = {};
  var nameUnique;

  return database.tag.nameExists(data.name)
    .then(function (_exists) {
      nameUnique = _exists === false;
      if(!nameUnique) {
        errors.name= errors.name || [];
        errors.name.push('name must be unique');
      }
      return validate.tag.create(data, errors, values);
    })
    .then(function (_validData) {
      var valid = (_validData === true) && (nameUnique === true);
      if(valid === true) {
        return validBranch();
      }
      else return invalidBranch();
    })
    .then(null, function (err) {
      return next(err);
    });
  
  function validBranch() {
    //edit tag and redirect to it
    var tag = {name: values.name, description: values.description, meta: {created: Date.now(), creator: sessUser.username}}
    return database.createTag(tag)
      .then(function (ret) {
        return res.redirect('/tag/' + values.name);
      });
  }

  function invalidBranch() {
    return res.render('tags-create', {data: values, errors: errors, session: sessUser});
  }

});

module.exports = router;
