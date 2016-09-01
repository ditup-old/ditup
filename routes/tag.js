'use strict';

var express = require('express');
var router = express.Router();
let co = require('co');

var process = require('../services/processing');
var validate = require('../services/validation');

router.get('/', function (req, res, next) {
  return res.redirect('tags');
});

router.get('/:tagname', function (req, res, next) {
  let db = req.app.get('database');
  return co(function * () {
    var sessUser = req.session.user;
    var tagname = req.params.tagname;
    let tag = yield db.tag.read(tagname);
    tag = process.tag.view(tag);

    //rendering
    res.locals.rights = {edit: sessUser.logged === true ? true : false};
    res.locals.tag = tag;
    return res.render('tag');
  })
    .catch(next);
});

//checking rights to edit tag
router.all('/:tagname/edit', function (req, res, next) {
  //at this moment any logged in user can edit tag. (how to do version control?)
  var sessUser = req.session.user;
  if(sessUser.logged !== true) {
    let e = new Error('Not Authorized');
    e.status = 403;
    return next(e);
  }
  return next();
});

router.get('/:tagname/edit', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    var sessUser = req.session.user;
    var tagname = req.params.tagname;

    let tag = yield db.tag.read(tagname);
    tag = process.tag.edit(tag);

    res.locals.tag = tag;
    return res.render('tag-edit');
  })
    .catch(next);
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
