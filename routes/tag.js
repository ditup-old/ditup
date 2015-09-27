'use strict';

var Q = require('q');
var express = require('express');
var router = express.Router();

var database = require('../services/data');
var process = require('../services/processing');
var validate = require('../services/validation');

router.get('/', function (req, res, next) {
  return res.redirect('tags');
});

router.get('/:name', function (req, res, next) {
  var sessUser = req.session.user;
  var name = req.params.name;

  return database.readTag({name: name})
    .then(function (tag) {
      if(tag === null) {
        var err = new Error('404: Tag not found.');
        err.status = 404;
        return next(err);
      }
      return process.tag.view(tag);
    })
    .then(function (tag) {
      return res.render('tag', {data: tag, session: sessUser});
    })
    .then(null, function(err) {
      return next(err);
    });
});

//checking rights to edit tag
router.all('/:name/edit', function (req, res, next) {
  //at this moment any logged in user can edit tag. (how to do version control?)
  var sessUser = req.session.user;
  if(sessUser.logged === true) return next();
  var err = new Error('you need to be logged in to edit this tag');
  return next(err);
});

router.get('/:name/edit', function (req, res, next) {
  var sessUser = req.session.user;
  var name = req.params.name;

  return database.readTag({name: name})
    .then(function (tag) {
      if(tag === null) {
        var err = new Error('404: Tag not found.');
        err.status = 404;
        return next(err);
      }
      return process.tag.edit(tag);
    })
    .then(function (tag) {
      return res.render('tag-edit', {data: tag, errors: {}, session: sessUser});
    })
    .then(null, function(err) {
      return next(err);
    });
});

router.post('/:name/edit', function (req, res, next) {
  var sessUser = req.session.user;
  var name = req.params.name;
  var desc = req.body.description;
  var tag = {name: name, description: desc};
  
  var errors = {};
  var values = {};

  //validate tag data
  return Q.resolve(validate.tag.edit(tag, errors, values))
    .then(function (isValid) {
      if(isValid === true) {
        return validBranch();
      }
      else return invalidBranch();
    })
    .then(null, function (err) {
      return next(err);
    });
  
  function validBranch() {
    //edit tag and redirect to it
    return database.updateTag({name: name, description: values.description})
      .then(function () {
        return res.redirect('/tag/' + name);
      });
  }

  function invalidBranch() {
    return res.render('tag-edit', {data: tag, errors: errors, session: sessUser});
  }

});

module.exports = router;
