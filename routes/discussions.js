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

router.use(getCollections('discussion', {router: express.Router(), db: db, countPastTime: countPastTime }));
//***************** END ***********************//

router.all('/new', function (req, res, next) {
  var sessUser = req.session.user;
  var logged = sessUser.logged;
  if(logged !== true) {
    sessUser.messages = sessUser.messages || [];
    sessUser.messages.push('you need to <a href="/login?redirect=%2Fdiscussions%2Fnew" >log in</a> to start a new discussion');
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


  if(!values.topic) {
    sessUser.messages.push('you need to write a topic');
    valid = false;
  }

  if(!(tagOutput.tags.all.length > 0)) {
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

  var id;
  return db.discussion.create({topic: values.topic, creator: sessUser.username})
    .then(function (_id) {
      id = _id;
      
      //TODO add tags to discussion (first check that they exist...)

      var url = generateUrl(values.topic);
      
      req.session.messages.push('the new discussion was successfully started.');
      return res.redirect('/discussion/'+id.id+'/'+url);
    })
    .then(null, function (err) {
      return res.end(err);
    });

});


module.exports = router;
