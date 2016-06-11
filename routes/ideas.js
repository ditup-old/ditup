'use strict';

var express = require('express');
var entities = require('entities');
var router = express.Router();
var validate = require('../services/validation');
var db = require('../services/data');
var generateUrl = require('./discussion/functions').generateUrl;
let countPastTime = require('../services/processing').cpt;
/*
router.get('/', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('ideas', {session: sessUser});
});
*/

router.get('/', function (req, res, next) {
  var sessUser = req.session.user;

  let popular, newest, random;
  //read popular (by followers) ideas
  return db.idea.popular('followers')
    .then(function (_pop) {
      popular = _pop;
    })
    //read newest ideas
    .then(() => {
      return db.idea.newest();
    })
    .then(function (_new) {
      newest = _new;

      for(let n of newest) {
        //if older than 2 days, show date. otherwise show days/hours/minutes/... passed.
        //let msDay = 3600*1000*24;//miliseconds in a day
        //let showDate = Date.now()-n.created > msDay*2;
        //n.past = showDate ? 'on '+Date(n.created) : countPastTime(n.created);
        n.past = countPastTime(n.created);
      }
    })
    //read random idea(s)
    .then(() => {
      return db.idea.random();
    })
    .then(function (_rand) {
      random = _rand;
    })
    //render
    .then(function () {
      return res.render('ideas', {session: sessUser, popular: popular, newest: newest, random: random});
    })
    //catch errors
    .then(null, function (err) {
      next(err);
    })
});

router.all('/new', function (req, res, next) {
  var sessUser = req.session.user;
  var logged = sessUser.logged;
  if(logged !== true) {
    sessUser.messages = sessUser.messages || [];
    sessUser.messages.push('you need to <a href="/login?redirect=%2Fideas%2Fnew" >log in</a> to create a new idea');
    return res.render('login', {session: sessUser, action: '/login?redirect=%2Fideas%2Fnew'});
  }

  return next();
});

router.get('/new', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('ideas-new', {session: sessUser});
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
    return res.render('ideas-new', {session: sessUser, values: values});
  }

  var id;
  var failedTags = [];
  var addedTags = [];

  return db.idea.create({name: values.name, description: values.description, creator: sessUser.username})
    .then(function (_id) {
      id = _id;
/*      var pchain = Promise.resolve();
      for(let tg of validTags) {
        pchain.then(db.idea.addTag(id.id, tg)).then(function () { addedTags.push(tg); console.log('success!', tg); }, function (err) { failedTags.push(tg); console.log('fail!!!', tg); });
      }

      return pchain;
    })
    .then(function () {
      console.log(failedTags, addedTags);    
      //TODO add tags to idea (first check that they exist...)
*/
      var url = generateUrl(values.name);
      
      req.session.messages.push('the new idea was successfully created.');
      //console.log(id, _id, url);
      return res.redirect('/idea/'+id.id+'/'+url);
    })
    .then(null, function (err) {
      return res.end(err);
    });
});

/*
router.post('/new', function (req, res, next) {
  var values = req.body;
  var sessUser = req.session.user;
  sessUser.messages = sessUser.messages || [];

  //process tags
  let tagInput = values.tags; 
  let rawTags = tagInput ? tagInput.replace(/\s*,?\s*$/,'').split(/\s*,\s*\/) : [];
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
    return res.render('ideas-new', {session: sessUser, values: values});
  }

  var id;
  return db.idea.create({topic: values.topic, creator: sessUser.username})
    .then(function (_id) {
      id = _id;
      
      //TODO add tags to idea (first check that they exist...)

      var url = generateUrl(values.topic);
      
      req.session.messages.push('the new idea was successfully started.');
      return res.redirect('/idea/'+id.id+'/'+url);
    })
    .then(null, function (err) {
      return res.end(err);
    });

});
*/

module.exports = router;
