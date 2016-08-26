'use strict';

let router = require('express').Router();
let co = require('co');
let processing = require('../../services/processing');

router.all('/:username/edit', function (req, res, next) {
  let sessUser = req.session.user;
  if(sessUser.logged === true && sessUser.username === req.params.username) {
    return next();
  }
  else {
    let err = new Error('Not Authorized');
    err.status = 403;
    throw err;
  }
});

router.post('/:username/edit', function (req, res, next) {
  let db = req.app.get('database');
  if(req.query.field === 'tags') {
    //adding tag
    if(req.body.action === 'add tag') {
      return co(function * () {
        let exists = yield db.tag.exists(req.body.tagname);
        if(exists) {
          yield db.user.addTag(req.params.username, req.body.tagname);
          req.session.user.messages.push(`the tag ${req.body.tagname} was added to your profile`);
          return next();
        }
        else{
          // TODO missing validation of the new tag data
          return res.render('tag-create-add', {tag: {name: req.body.tagname}});
        }
      })
        .catch(function (err) {
          if(err.code === 409) {
            req.session.user.messages.push(`the tag ${req.body.tagname} is already added`);
            return next();
          }
          return next(err);
        });
    }
    else if(req.body.action === 'create and add tag') {
      return co(function * () {
        //TODO validation
        //
        //create the tag
        yield db.tag.create({
          name: req.body.tagname,
          description: req.body.description,
          meta: {
            creator: req.session.user.username
          }
        });
        //tag the tag to the user
        yield db.user.addTag(req.params.username, req.body.tagname);
        //make a message
        req.session.user.messages.push(`the tag ${req.body.tagname} was created and added to your profile`);
        return next();
      })
        .catch(next);
    }
    else if(req.body.action === 'remove tag') {
      return co(function * () {
        yield db.user.removeTag(req.params.username, req.body.tagname);
        next();
      })
        .catch(next);
    }
    else return next();
  }
  else {
    return next();
  }
});

router.all('/:username/edit', function (req, res, next) {
  let fields = ['name', 'tags', 'about', 'birthday', 'gender', 'avatar'];
  let queryField = req.query.field;

  if(fields.indexOf(queryField) > -1) {
    return co(function * () {
      let db = req.app.get('database');
      var username = req.params.username;
      var sessUser = req.session.user;

      //read user
      let user = yield db.user.read({username: username});
      //making data fit for profile
      let profile = yield processing.user.profileEdit(user);
      //reading tags
      res.locals.tags = yield db.user.tags(username);

      res.locals.edit = true;

      res.locals.field = queryField;

      return res.render('user-profile', {profile: profile});
    }).catch(next);
  }

  return next();
});

/*
//checking whether user can edit (him/her self)
router.all('/:username/edit', function (req, res, next) {
  let sessUser = req.session.user;
  if(sessUser.logged === true && sessUser.username === req.params.username) {
    return next();
  }
  else {
    let err = new Error('Not Authorized');
    err.status = 403;
    throw err;
  }
})
//posting tags
.post('/:username/edit', function (req, res, next) {
  let db = req.app.get('database');
  if(req.query.field === 'tags') {
    //adding tag
    if(req.body.action === 'add tag') {
      return co(function * () {
        let exists = yield db.tag.exists(req.body.tagname);
        if(exists) {
          yield db.user.addTag(req.params.username, req.body.tagname);
          req.session.user.messages.push(`the tag ${req.body.tagname} was added to your profile`);
          return next();
        }
        else{
          // TODO missing validation of the new tag data
          return res.render('tag-create-add', {tag: {name: req.body.tagname}});
        }
      })
        .catch(function (err) {
          if(err.code === 409) {
            req.session.user.messages.push(`the tag ${req.body.tagname} is already added`);
            return next();
          }
          return next(err);
        });
    }
    else if(req.body.action === 'create and add tag') {
      return co(function * () {
        //TODO validation
        //
        //create the tag
        yield db.tag.create({
          name: req.body.tagname,
          description: req.body.description,
          meta: {
            creator: req.session.user.username
          }
        });
        //tag the tag to the user
        yield db.user.addTag(req.params.username, req.body.tagname);
        //make a message
        req.session.user.messages.push(`the tag ${req.body.tagname} was created and added to your profile`);
        return next();
      })
        .catch(next);
    }
    else if(req.body.action === 'remove tag') {
      return co(function * () {
        yield db.user.removeTag(req.params.username, req.body.tagname);
        next();
      })
        .catch(next);
    }
    else return next();
  }
  else {
    return next();
  }
})
.post('/:username/edit', function (req, res, next){
  let database = req.app.get('database');
  var username = req.params.username;
  var sessUser = req.session.user;

  var user, rights;
  var profile = {};
  var errors = {};

  if(req.query.field === 'tags') return next();

  database.readUser({username: username})
    .then(function (_user){
      user = _user;
      return myRightsToUser(sessUser, user);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.edit !== true){
        throw new Error('you don\'t have rights to edit user ' + username + '. you probably need to be logged in as this user.');
      }

      var form = req.body;
      var profileForm = {
        birthday: form.birthday,
        gender: form.gender,
        name: form.name,
        surname: form.surname,
        about: form.about,
      };
      return validate.user.profile(profileForm, errors, profile);
    })
    .then(function (valid) {
      if(valid !== true) throw new Error('invalid');
      return database.updateUserProfile({username: username}, profile);
    })
    .then(function () {
      return res.redirect('/user/' + username);
    })
    .then(null, function (err) {
      if(err.message === 'invalid'){
        return res.render('user-profile-edit', {profile: profile, errors: errors, rights: rights});
      }
      next(err);
    });
})
.all('/:username/edit', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    var username = req.params.username;
    var sessUser = req.session.user;

    //read user
    let user = yield db.user.read({username: username});
    //making data fit for profile
    let profile = yield processing.user.profileEdit(user);
    //reading tags
    res.locals.tags = yield db.user.tags(username);

    return res.render('user-profile-edit', {profile: profile, errors: {}});
  }).catch(next);
});
// */

module.exports = router;
