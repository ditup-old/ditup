'use strict';

let router = require('express').Router();
let co = require('co');
var multer = require('multer');
var image = require('../../services/image');
let processing = require('../../services/processing');

let validate = require('../../services/validation/validate');

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

//upload avatar image
var upload = multer({
  dest: './files/uploads/',
  limits: {
    fileSize: 2*1024*1024
  }
});

router.post('/:username/edit',
  //check that the field is 'avatar'
  function (req, res, next){
    if(req.query.field === 'avatar') return next();
    else return next(new Error('not avatar'));
  },
  //multer
  upload.single('avatar'),
  //processing the uploaded image
  function (req, res, next) {
    return co(function * (){
      var username = req.params.username;
      if (req.file === undefined) throw new Error('file too big or other error');

      var tempPath = req.file.path;

      yield image.avatar.create(tempPath, username);
      return res.redirect(`/user/${username}`);
    })
      .catch(next);
  },
  //if field is not avatar, continue routing
  function (err, req, res, next) {
    if(err.message === 'not avatar') return next();
    else return next(err);
  }
);

////tags
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

router.post('/:username/edit', function (req, res, next) {
  let username = req.params.username;
  //name & surname
  if(req.query.field === 'name') {
    return co(function * () {
      let db = req.app.get('database');
      //validate
      validate.user.name(req.body.name);
      validate.user.surname(req.body.surname);
      //save to database
      yield db.user.updateProfile({username: username}, {name: req.body.name, surname: req.body.surname});
      return res.redirect(`/user/${req.params.username}`);
    }).catch(next);
  }
  //about
  else if(req.query.field === 'about') {
    return co(function * () {
      let db = req.app.get('database');

      validate.user.about(req.body.about);

      yield db.user.updateProfile({username: username}, {about: req.body.about});
      return res.redirect(`/user/${req.params.username}`);
    }).catch(next);
  }
  //birthday
  else if(req.query.field === 'birthday') {
    return co(function * () {
      let db = req.app.get('database');

      validate.user.birthday(req.body.birthday);

      yield db.user.updateProfile({username: username}, {birthday: req.body.birthday});
      return res.redirect(`/user/${req.params.username}`);
    }).catch(next);
  }
  //gender
  else if(req.query.field === 'gender') {
    return co(function * () {
      let db = req.app.get('database');

      validate.user.gender(req.body.gender);

      yield db.user.updateProfile({username: username}, {gender: req.body.gender});
      return res.redirect(`/user/${req.params.username}`);
    }).catch(next);
  }

  return next();
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
