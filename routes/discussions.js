'use strict';

var express = require('express');
var entities = require('entities');
var router = express.Router();
var validate = require('../services/validation');

router.get('/', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('discussions', {session: sessUser});
});

router.all('/new', function (req, res, next) {
  var sessUser = req.session.user;
  var logged = sessUser.logged;
  if(logged !== true) {
    sessUser.messages = sessUser.messages || [];
    sessUser.messages.push('you need to <a href="/login?return-page=%2Fdiscussions%2Fnew" >log in</a> to start a new discussion');
    return res.render('sysinfo', {session: sessUser});
  }

  return next();
});

router.get('/new', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('discussions-new', {session: sessUser});
});

router.post('/new', function (req, res, next) {
  var values = req.body;
  var sessUser = req.session.user;
  sessUser.messages = sessUser.messages || [];

  //process tags
  let tagInput = values.tags; 
  let rawTags = tagInput ? tagInput.replace(/\s*,?\s*$/,'').split(/\s*,\s*/) : [];
  let tags = [];
  let invalidTags = [];
  let validTags = [];

  var areTagsValid = true;
  var valid = true;
  for(let rawTag of rawTags){ 
    let thisValid = validate.tag.name(rawTag); 
    if(thisValid === true) validTags.push(rawTag);
    else invalidTags.push(rawTag);
    tags.push(rawTag);

    areTagsValid = areTagsValid && thisValid;
  }

  if(areTagsValid !== true) {
    valid = false;
    let invalidTagString = '';
    for(let i=0, len = invalidTags.length; i<len; i++) {
      invalidTagString += entities.encodeHTML(invalidTags[i]);
      if(i<len-1) invalidTagString += ', ';
    }
    sessUser.messages.push('the tags '+ invalidTagString +'  are badly formatted');
  }


  if(!values.topic) {
    sessUser.messages.push('you need to write a topic');
    valid = false;
  }

  if(!(tags.length > 0)) {
    sessUser.messages.push('you need to choose 1 or more tags');
    valid = false;
  }

  if(!values.post) {
    sessUser.messages.push('you need to write a post');
    valid = false;
  }

  if(valid !== true) {
    return res.render('discussions-new', {session: sessUser, values: values});
  }
  return res.redirect('/discussion/12345679/discussion-title-shortcut');
});


module.exports = router;
