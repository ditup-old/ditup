'use strict';

var Q = require('q');
var express = require('express');
var router = express.Router();
var validate = require('../services/validation');
var process = require('../services/processing');
var database = require('../services/data');

router.get('/', function (req, res, next) {
  var url = '/'+req.originalUrl.replace(/^[\/]+|[\/]+$/,'');
  return res.redirect(url+'s');
});

router.all(['/:url', '/:url/*'], function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    next();
  }
  else {
    var err = new Error('you need to log in to continue');
    next(err);
  }
});

router.get(['/:url', '/:url/*'], function (req, res, next) {
  var url = req.params.url;
  var originalUrl = req.originalUrl;
  var urlArray = req.originalUrl.replace(/^[\/]+|[\/]+$/,'').split('/');
  var originalDittype = urlArray[0];
  
  var dit;
  //read dit
  return database.readDit({url: url})
    .then(function (_dit) {

      var ditNotExist = _dit === null;
      if(ditNotExist) {
        var err = new Error('Dit Not Found');
        err.status = 404;
        throw err;
      }
      dit = _dit;
      req.dit = dit;

      dit.dittype = dit.dittype || 'dit';
      
      if(originalDittype !== dit.dittype) {
        urlArray[0] = dit.dittype;
        return res.redirect('/'+urlArray.join('/'));
      }
      return next();
    })
    .then(null, function (err) {
      next(err);
    });
});

router.get('/:url', function (req, res, next) {
  var sessUser = req.session.user;
  var url = req.params.url;
  
  var dit, rights;
  //read dit
  return Q.resolve(req.dit)
    .then(function (_dit) {
      dit = _dit;

      //check my rights to dit
      return getMyRightsToDit(sessUser, dit);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.view !== true) {
        throw new Error('you don\'t have rights to see the dit');
      }
      return process.dit.profile(dit);
    })
    .then(function (profile) {
      res.render('dit-profile', {data: profile, rights: rights, session: sessUser});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.get('/:url/logo', function (req, res, next) {
  /*
    //check if i have rights to see the logo
    //load the logo
    //serve the logo
    next();
  */
  next();
});

router.get('/:url/edit', function (req, res, next) {
  var sessUser = req.session.user;
  var url = req.params.url;
  
  var dit, rights;

  //read dit
  return Q.resolve(req.dit)
    .then(function (_dit) {
      dit = _dit;

      //check my rights to dit
      return getMyRightsToDit(sessUser, dit);
    })
    .then(function (_rights) {
      rights = _rights;
      if(rights.edit !== true) {
        throw new Error('you don\'t have rights to edit the dit');
      }

      //process data
      return process.dit.profileEdit(dit);
    })
    .then(function (profile) {
      //render the editing page
      res.render('dit-profile-edit', {data: profile, rights: rights, errors: {}, session: sessUser});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post('/:url/edit', function (req, res, next) {
  var sessUser = req.session.user;

  var url = req.params.url;
  var form = req.body;
  var formData = {
    dittype: form.dittype,
    name: form.name,
    summary: form.summary,
    about: form.about
  };

  console.log('*************** form data************ \\n',formData);

  var me = {username: sessUser.username};
  var dit = {url: url};
  
  var errors = {};
  var values = {};

  return database.isAdmin(me, dit)
    .then(function (isAdmin) {
      if(isAdmin !== true) throw new Error('you don\'t have rights to edit this dit');
      return validate.dit.profile(formData, errors, values);
    })
    .then(function (isValid) {
      if(isValid === true) return validBranch();
      else return invalidBranch();
    })
    .then(null, function (err) {
      next(err);
    });

  function validBranch() {
    return database.updateDitProfile(dit, values)
      .then(function () {
        return res.redirect('/'+ (values.dittype || 'dit') + '/' + url);
      });
  }
  
  function invalidBranch() {
    return database.readDit({url: url})
      .then(function (_dit) {
        return process.dit.profileEdit(_dit);
      })
      .then(function (_profile) {
        for(var name in values){
          _profile[name] = values[name];
        }
        return res.render('dit-profile-edit', {data: _profile, rights: {view: true, edit: true}, errors: errors, session: sessUser});
      });
  }
});

router.get('/:url/settings', function (req, res, next) {
  
});

router.post('/:url/settings', function (req, res, next) {
  
});

module.exports = router;

var getMyRightsToDit = function (me, dit) {
  /****
  1. if not logged in, view: false
     else if all, view: true
     else if members && i'm member || admin: view: true, edit: fa
     else if members && i'm admin: view: true, edit: true
     else if admins && i'm admin: view: 
  ****/
  //console.log(dit);
  if(me.logged !== true) {
    return Q.resolve({
      view: false,
      edit: false
    });
  }

  var viewSettings = dit.settings.view;

  return database.readMemberOf(me, dit)
    .then(function (edge) {
      var relation = edge === null ? null : edge.relation;
      var view = false;
      var edit = false;
      if(relation === 'admin'){
        view = true;
        edit = true;
      }

      if (viewSettings === 'all') {
        view = true;
      }
      else if (viewSettings === 'members' && (relation === 'member' || relation === 'admin')){
        view = true;
      }
      else if (viewSettings === 'admins' && relation === 'admin'){
        view = true;
      }
      return {view: view, edit: edit};
    });
};
