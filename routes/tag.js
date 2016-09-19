'use strict';

var express = require('express');
var router = express.Router();
let co = require('co');

var process = require('../services/processing');
var validate = require('../services/validation/validate');

let generateUrl = require('./collection/functions').generateUrl;

router.get('/', function (req, res, next) {
  return res.redirect('tags');
});

router.get(['/:tagname/users', '/:tagname/challenges', '/:tagname/ideas', '/:tagname/projects', '/:tagname/discussions'], function (req, res, next) {
  if(req.session.user.logged === true) {
    return next();
  }
  let e = new Error('Not Authorized');
  e.status = 403;
  return next(e);
})
.get('/:tagname', function (req, res, next) {
  let sessUser = req.session.user;
  if(sessUser.logged !== true) {
    sessUser.messages.push('log in to see more and contribute');
  }
  return next();
})
.get(['/:tagname', '/:tagname/users', '/:tagname/challenges', '/:tagname/ideas', '/:tagname/projects', '/:tagname/discussions'], function (req, res, next) {
  let db = req.app.get('database');
  return co(function * () {
    var sessUser = req.session.user;
    var tagname = req.params.tagname;
    let tag = yield db.tag.read(tagname);
    tag = process.tag.view(tag);

    //rendering
    res.locals.rights = {edit: sessUser.logged === true ? true : false};
    res.locals.tag = tag;
    res.locals.count = yield db.tag.uses(tagname);

    return next();
  })
    .catch(next);
})
.get(['/:tagname/:page'], function (req, res, next) {
  let page = req.params.page;

  //check for validity of the :page parameter
  let validPages = ['users', 'challenges', 'ideas', 'projects', 'discussions'];
  let isValidPage = validPages.indexOf(page) > -1;
  if(!isValidPage) return next();

  let upPage = page.capitalizeFirstLetter();

  let db = req.app.get('database');
  return co(function * () {
    var sessUser = req.session.user;
    var tagname = req.params.tagname;

    let cols = yield db.tag[`read${upPage}`](tagname);

    //for each collection generate url
    if(page !== 'users') {
      for(let col of cols) {
        col.url = generateUrl(col.name);
      }
    }

    //remove profile & tags from user if not logged in
    if(page === 'users' && sessUser.logged !== true) {
      for(let user of cols) {
        delete user.profile;
        delete user.tags;
        user.profile = [];
      }
    }

    res.locals[page] = cols;

    res.locals.page = page;
    return next();
  })
    .catch(next);
})
//rendering
.get(['/:tagname', '/:tagname/users', '/:tagname/challenges', '/:tagname/ideas', '/:tagname/projects', '/:tagname/discussions'], function (req, res, next) {
  return res.render('tag');
});

//checking rights to edit tag
router.all('/:tagname/edit', function (req, res, next) {
  //at this moment any logged in user can edit tag. (how to do version control?)
  var sessUser = req.session.user;
  if(sessUser.logged !== true) {
    let e = new Error('Not Authorized');
    e.status = 403;
    return next(e);
  }
  return next();
});

router.post('/:tagname/edit', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    let tagname = req.params.tagname;
    
    //validation
    validate.tag.description(req.body.description);
    //updating in database
    yield db.tag.update(tagname, {description: req.body.description});
    //informing about success
    req.session.messages.push(`the tag ${tagname} was successfully updated`);
    //redirect to the tag page
    return res.redirect(`/tag/${tagname}`);
  })
    .catch(next);
}, function (err, req, res, next) {
  if(err.status === 400) {
    req.session.user.messages.push(err.message);
    return next();
  }
  return next(err);
});

router.all('/:tagname/edit', function (req, res, next) {
  return co(function * () {
    let db = req.app.get('database');
    var sessUser = req.session.user;
    var tagname = req.params.tagname;

    let tag = yield db.tag.read(tagname);
    tag = process.tag.edit(tag);
    
    //filling form with the invalid data
    if(req.method === 'POST') {
      tag.description = req.body.description;
    }

    res.locals.tag = tag;
    return res.render('tag-edit');
  })
    .catch(next);
});

module.exports = router;
