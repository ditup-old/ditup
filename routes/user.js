'use strict';

var fs = require('fs');
var multer = require('multer');
var express = require('express');
var router = express.Router();
var processing = require('../services/processing');
var validate = require('../services/validation');
var image = require('../services/image');

let co = require('co');

router
.post('/:username', function (req, res, next){
  return co(function * () {
    let sessUser = req.session.user;
    let username = req.params.username;

    let db = req.app.get('database');
    let action = req.body.action;
    
    //follow or unfollow user
    if(req.body.action === 'follow') {
      yield db.user.follow(sessUser.username, username);
      return next();
    }
    else if(req.body.action === 'unfollow') {
      yield db.user.unfollow(sessUser.username, username);
      return next();
    }
    else{
      throw new Error('post not recognized');
    }
  })
    .catch(next);
})
.all('/:username', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    var username = req.params.username;
    var sessUser = req.session.user;

    //read user
    let user = yield db.user.read({username: username});

    let profile = yield processing.user.profile(user);

    if(!sessUser.logged) {
      profile = {username: profile.username};
    }
    
    //show number of followers
    if(sessUser.logged === true) {
      profile.followers = yield db.user.countFollowers(username);
    }
    
    //find out whether logged user is following this user
    if(sessUser.logged === true && sessUser.username !== username) {
      profile.following = yield db.user.following(sessUser.username, username);
    }
    
    res.locals.profile = profile;
    res.locals.tags = yield db.user.tags(username);

    return res.render('user-profile');
  })
    .catch(next);
});

module.exports = router;
/*
var routeUserProjects = require('./user/projects');
var routeUserCollections = require('./user/collections');

router.get('/', function (req, res, next) {
  return res.redirect('/users');
});


//check login for all
router.all(['/:username', '/:username/*'], function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    next();
  }
  else {
    var err = new Error('you need to log in to continue');
    next(err);
  }
});

//router for /user/[username]/projects
router.use(routeUserProjects());
router.use(routeUserCollections('idea'));
router.use(routeUserCollections('challenge'));
router.use(routeUserCollections('discussion'));

router
.post('/:username', function (req, res, next){
  return co(function * () {
    let sessUser = req.session.user;
    let username = req.params.username;

    let db = req.app.get('database');
    let action = req.body.action;
    
    //follow or unfollow user
    if(req.body.action === 'follow') {
      yield db.user.follow(sessUser.username, username);
      next();
    }
    else if(req.body.action === 'unfollow') {
      yield db.user.unfollow(sessUser.username, username);
      next();
    }
    else{
      throw new Error('post not recognized');
    }
  })
    .catch(next);
})
.all('/:username', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    var username = req.params.username;
    var sessUser = req.session.user;

    //read user
    let user = yield db.user.read({username: username});
    let rights = yield myRightsToUser(sessUser, user);

    if(rights.view !== true) throw new Error('you don\'t have rights to see user');

    let profile = yield processing.user.profile(user);
    if(sessUser.logged === true && sessUser.username !== username) {
      profile.following = yield db.user.following(sessUser.username, username);
    }
    
    res.locals.tags = yield db.user.tags(username);

    return res.render('user-profile', {profile: profile, rights: rights});
  })
    .catch(next);
});

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


router.get('/:username/avatar', function (req, res, next) {
  let database = req.app.get('database');
  var username = req.params.username;
  var sessUser = req.session.user;

  var user, rights;

  //read user
  return database.readUser({username: username})
    .then(function (_user) {
      user = _user;
      if(_user === null) {
        var err = new Error('user not found');
        err.status = 404;
        throw err;
      }
      //check if i can see her.
      return myRightsToUser(sessUser, _user);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.view !== true) throw new Error('you don\'t have rights to see user');
      //read the avatar image of user
      return image.avatar.read(username);
    })
    .then(function (_img) {
      res.writeHead(200, {'Content-Type': _img.type});
      return res.end(_img.data); // Send the file data to the browser.
    })
    .then(null, function (err) {
      return next(err);
    });
});

//check if i can see & change settings of user (basically: is it me?)
router.all(['/:username/settings', '/:username/upload-avatar'], function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  
  if(sessUser.username === username) {
    return next();
  }

  return next(new Error('you cannot view & change settings of user'));
});

router.get('/:username/settings', function (req, res, next) {
  let database = req.app.get('database');
  //read settings
  //process settings
  //render settings page

  var sessUser = req.session.user;
  var username = req.params.username;

  var user;
  
  //read settings
  return database.readUser({username: username})
    .then(function (_user) {
      if(_user === null) throw (new Error('user does not exist (this should not ever happen! already checked that user is me.)').status(404)); 
      user = _user;
      
      //process settings
      return processing.user.settings(user);
    })
    .then(function (_data) {
      //render the settings page
      res.render('user-settings', {data: _data, errors: {}});
    })
    .then(null, function (err) {
      next(err);
    });
});


//depends on router.all which checks the rights. this one is allowed only after checking those rights
router.post('/:username/settings', function (req, res, next) {
  let database = req.app.get('database');
  var sessUser = req.session.user;

  var username = req.params.username;
  var form = {
    view: req.body.view
  };

  var errors = {};
  var values = {};

  return Promise.resolve(validate.user.settings(form, errors, values))
    .then(function (isValid) {
      if(isValid === true) return validBranch();
      else return invalidBranch();
    })
    .then(null, function (err) {
      next(err);
    });


  function validBranch() {
    var settings = values;
    return database.updateUserSettings({username: username}, settings)
      .then(function (response) {
        return res.render('sysinfo', {msg: '<a href="" >settings</a> of <a href="/user/' + username + '" >' + username + '</a> were successfully updated'});
      });
  }
  
  function invalidBranch() {
    var user;
    
    //read settings
    return database.readUser({username: username})
      .then(function (_user) {
        if(_user === null) throw (new Error('user does not exist (this should not ever happen! already checked that user is me.)').status(404)); 
        user = _user;
        
        //process settings
        return processing.user.settings(user);
      })
      .then(function (_data) {
        _data.settings = values;
        //render the settings page
        res.render('user-settings', {data: _data, errors: errors});
      })
      .then(null, function (err) {
        next(err);
      });
  }
});


var upload = multer({
  dest: './files/uploads/',
  limits: {
    fileSize: 2*1024*1024
  }
});

router.post('/:username/upload-avatar', upload.single('avatar'), function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.params.username;
  if (sessUser.username !== username) throw new Error('this should never happen. already checked that they\'re similar');
  if (req.file === undefined) throw new Error('file too big or other error');

  var tempPath = req.file.path;

  return image.avatar.create(tempPath, username)
    .then(function (){
      return res.redirect('/user/' + username + '/edit');
    })
    .then(null, function (err) {
      return next(err);
    });
});

module.exports = router;

function myRightsToUser(me, user) {
  //TODO involve user settings
  var amILogged = me.logged === true ? true : false;
  var isItMe = me.logged === true && me.username === user.username;
  var canIView = amILogged;
  var canIEdit = isItMe;

  return ({
    view: canIView,
    edit: canIEdit
  });
};
// */
