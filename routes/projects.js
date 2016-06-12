'use strict';

var express = require('express');
var router = express.Router();

var validate = require('../services/validation');
var db = require('../services/data');
var generateUrl = require('./discussion/functions').generateUrl;

//***************** BEGIN router for / ********//
let countPastTime = require('../services/processing').cpt;
var getCollections = require('./partial/collections');

router.use(getCollections('project', {router: express.Router(), db: db, countPastTime: countPastTime }));
//***************** END ***********************//

router.all('/new', function (req, res, next) {
  var sessUser = req.session.user;
  var logged = sessUser.logged;
  if(logged !== true) {
    sessUser.messages = sessUser.messages || [];
    sessUser.messages.push('you need to <a href="/login?redirect=%2Fprojects%2Fnew" >log in</a> to create a new project');
    return res.render('login', {session: sessUser, action: '/login?redirect=%2Fprojects%2Fnew'});
  }

  return next();
});

router.get('/new', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('projects-new', {session: sessUser});
});

router.post('/new', function (req, res, next) {
  var values = req.body;
  var sessUser = req.session.user;
  sessUser.messages = sessUser.messages || [];
  var valid = true;

  if(!(values.joining === 'yes' || values.joining === 'no')) {
    sessUser.messages.push('please select yes or no for joining');
    valid = false;
  }

  let joining = values.joining === 'yes' ? true : false;

  if(!values.name) {
    sessUser.messages.push('you need to write a name');
    valid = false;
  }

  var isNameTooLong = values.name.length > 1024;
  var isDescriptionTooLong = values.description.length > 16384;
  var isJoinInfoTooLong = values['join-info'].length > 16384;

  if(isNameTooLong) {
    sessUser.messages.push('the name is too long');
    valid = false;
  }

  if(isDescriptionTooLong) {
    sessUser.messages.push('the description is too long');
    valid = false;
  }

  if(isJoinInfoTooLong) {
    sessUser.messages.push('the join info is too long');
    valid = false;
  }

  if(valid !== true) {
    return res.render('projects-new', {session: sessUser, values: values});
  }

  var id;

  return db.project.create({name: values.name, description: values.description, join: !!joining, join_info: values['join-info'], creator: sessUser.username})
    .then(function (_id) {
      id = _id.id;
    })
    //******* make the creator a member
    .then(function () {
      return db.project.addMember(id, sessUser.username, 'member');
    })
    .then(function () {

      var url = generateUrl(values.name);
      
      req.session.messages.push('the new project was successfully created. add some tags!');
//      return res.end('success!');
      return res.redirect('/project/'+id+'/'+url);
    })
    .then(null, function (err) {
      console.log(err);
      return next(err);
    });
  return res.end();
});

module.exports = router;
