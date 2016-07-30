'use strict';

var express = require('express');
var entities = require('entities');
var router = express.Router();
var validate = require('../services/validation');
var db = require('../services/data');
var generateUrl = require('./discussion/functions').generateUrl;

//***************** BEGIN router for / ********//
let countPastTime = require('../services/processing').cpt;
var getCollections = require('./partial/collections');

router.use(getCollections('challenge', {router: express.Router(), db: db, countPastTime: countPastTime }));
//***************** END ***********************//

router.all('/new', function (req, res, next) {
  var sessUser = req.session.user;
  var logged = sessUser.logged;
  if(logged !== true) {
    sessUser.messages = sessUser.messages || [];
    sessUser.messages.push('you need to <a href="/login?redirect=%2Fchallenges%2Fnew" >log in</a> to create a new challenge');
    return res.render('login', {session: sessUser, action: '/login?redirect=%2Fchallenges%2Fnew'});
  }

  return next();
});

router.get('/new', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('challenges-new', {session: sessUser});
});

router.post('/new', function (req, res, next) {
  var values = req.body;
  var sessUser = req.session.user;
  sessUser.messages = sessUser.messages || [];
  var valid = true;

  let tagInput = values.tags;
  var valid = true;
  //process tags

  var tagOutput = {};
  var areTagsValid = validate.tag.input(tagInput, tagOutput);

  if(areTagsValid !== true) {
    valid = false;
    let invalidTagString = '';
    let invalidTags = tagOutput.tags.invalid;
    for(let i=0, len = invalidTags.length; i<len; i++) {
      invalidTagString += entities.encodeHTML(invalidTags[i]);//sanitized!! string of tags
      if(i<len-1) invalidTagString += ', ';
    }
    sessUser.messages.push('the tags '+ invalidTagString +'  are badly formatted');
  }

  if(!(tagOutput.tags.all.length > 0)) {
    sessUser.messages.push('you need to choose 1 or more tags');
    valid = false;
  }

  if(!values.name) {
    sessUser.messages.push('you need to write a name');
    valid = false;
  }

  var isNameTooLong = values.name.length > 1024;
  var isDescriptionTooLong = values.description.length > 16384;

  if(isNameTooLong) {
    sessUser.messages.push('the name is too long');
    valid = false;
  }

  if(!values.description) {
    sessUser.messages.push('you need to write a description');
    valid = false;
  }

  if(isDescriptionTooLong) {
    sessUser.messages.push('the description is too long');
    valid = false;
  }

  if(valid !== true) {
    return res.render('challenges-new', {session: sessUser, values: values});
  }

  var id;
  var failedTags = [];
  var addedTags = [];

  return db.challenge.create({name: values.name, description: values.description, creator: sessUser.username})
    .then(function (_id) {
      id = _id;

      var url = generateUrl(values.name);
      
      req.session.messages.push('the new challenge was successfully created.');
      console.log(id, _id, url);
      return res.redirect('/challenge/'+id.id+'/'+url);
    })
    .then(null, function (err) {
      return res.end(err);
    });
});

module.exports = router;
