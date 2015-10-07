'use strict';

var express = require('express');
var router = express.Router();
var validate = require('../services/validation');
var database = require('../services/data');
var process = require('../services/processing');

router.get('/', function (req, res, next) {
  //TODO
  var sessUser = req.session.user;
  var dittype = req.originalUrl.substr(1).slice(0, -1);


  var options = dittype === 'dit' ? {} : {dittype: dittype};
  var clone = function (object) {
    return JSON.parse(JSON.stringify(object));
  };
    return Promise.all([database.dit.popular(clone(options)), database.dit.newest(clone(options)), database.dit.random(clone(options))])
      .then(function (_ret) {
        var popular = [];
        for(let p of _ret[0]) {
          let pp = p.dit;
          pp.relno = p.relno;
          popular.push(pp);
        };
        var newest = _ret[1];
        for (let n of newest) {
          n.created = process.cpt(n.created);
        }
        var random = _ret[2];

        return res.render('dits/main', {
          data: {
            dittype: dittype,
            popular: popular,
            newest: newest,
            random: random
          }, session: sessUser
        });
      })
      .then(null, function (err) {
        return next(err);
      });
});

//check if user is logged in
router.all('/create', function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged !== true) {
    var err = new Error('you need to log in to continue');
    return next(err);
  }
  else {
    return next();
  }
});

router.get('/create', function (req, res, next) {
  var sessUser = req.session.user;
  var urlArray = req.originalUrl.replace(/^[\/]+|[\/]+$/,'').split('/');
  var dittype = urlArray[0].slice(0, -1);

  //render dit creating form
  return res.render('dit-create', {session: sessUser, errors: {}, values: {dittype: dittype === 'dit' ? '' : dittype}});
});

router.post('/create', function (req, res, next) {
  var sessUser = req.session.user;

  var form = req.body;
  var data = {
    name: form.name,
    url: form.url,
    dittype: form.dittype,
    summary: form.summary,
  };

  var errors = {};
  var values = {};
  var urlUnique;

  //check if url is unique
  return database.urlExists(data.url)
    .then(function (_exists) {
      urlUnique = _exists === false;
      if(!urlUnique) {
        errors.url = errors.url || [];
        errors.url.push('url must be unique');
      }
      return validate.dit.create(data, errors, values);
    })
    .then(function (_valid) {
      var valid = (_valid === true) && (urlUnique === true);
      if(valid === true) {
        return validBranch();
      }
      else{
        errors.url = errors.url || [];
        return invalidBranch();
      }
    })
    .then(null, function (err) {
      next(err);
    });
  
  function validBranch() {
    //structure for database
    var ditToSave = {
      url: values.url,
      dittype: values.dittype,
      profile: {
        name: values.name,
        summary: values.summary,
        about: ''
      },
      created: Date.now(),
      settings: {
        view: 'all' //(all, members, admins)
      }
    };

    var creator = {username: sessUser.username};

    return database.createDit(ditToSave, creator)
      .then(function (response) {
        //redirect to dit editing page
        return res.redirect('/' + (values.dittype || 'dit') + '/' + values.url + '/edit');
      });
  }

  function invalidBranch() {
    return res.render('dit-create', {session: sessUser, errors: errors, values: values});
  }
});

module.exports = router;
