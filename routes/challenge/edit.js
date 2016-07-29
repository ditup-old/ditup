'use strict';

let co = require('co');
let router = require('express').Router();
var functions = require('../collection/functions');
var generateUrl = functions.generateUrl;

router.all('/:id/:url/edit', function (req, res, next) {
  let db = req.app.get('database');
  let sessUser = req.session.user;
  let authorized;

  let id = req.params.id;

  return co(function *() {
    let collection = yield db.challenge.read(id);
    
    if(sessUser.logged && collection.creator.username === sessUser.username) {
      authorized = true;
    }

    if(authorized !== true) {
      let err = new Error('Not Authorized');
      err.status = 403;
      next(err);
    }
    next();
  });

});

router.get('/:id/:url/edit', function (req, res, next) {
  let db = req.app.get('database');
  let sessUser = req.session.user;

  //find out which fields to edit
  let editFields = [];
  if(req.query.field === 'name') editFields.push('name');
  if(req.query.field === 'description') editFields.push('description');


  var id = req.params.id;
  var url = req.params.url;
  req.ditup.challenge = req.ditup.challenge || {};

  return co(function *() {
    //read the challenge
    var challenge = yield db.challenge.read(id);
    challenge.link = 'http://'+req.headers.host+req.originalUrl; //this is a link for users for copying
    challenge.id = id;

    //read tags of challenge
    let tags = yield db.challenge.tags(id);
    challenge.tags = [];
    for(let tag of tags) {
      challenge.tags.push(tag.name);
    }

    //sending the response
    return res.render('challenge-edit', {session: sessUser, challenge: challenge, edit: editFields});
  })
    .catch(next);
});

router.post('/:id/:url/edit', function (req, res, next) {
  let db = req.app.get('database');
  let sessUser = req.session.user;

  //find out which fields to edit
  let editFields = [];
  if(req.query.field === 'name') editFields.push('name');
  if(req.query.field === 'description') editFields.push('description');


  var id = req.params.id;
  var url = req.params.url;


  if(editFields.indexOf('name')>-1) {
    //we are editing
    let name = req.body.name;
    //TODO validate the name
    return co(function *() {
      yield db.challenge.updateName(id, name);
      req.session.messages.push('the name was updated');
      let newUrl = generateUrl(name);
      return res.redirect(`/challenge/${id}/${newUrl}`);
    });
  }
  if(editFields.indexOf('description')>-1) {
    let description = req.body.description;
    //TODO validate the description
    return co(function *() {
      yield db.challenge.updateDescription(id, description);
      req.session.messages.push('the description was updated');
      return res.redirect(`/challenge/${id}/${url}`);
    });
  }
  else {
    throw new Error('no');
  }
});

module.exports = router;
