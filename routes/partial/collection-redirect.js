'use strict'

//TODO this will be a middleware to redirect collections to their right url (depending on their name). it is unfinished. just copy-pasted from project

var co = require('co');
var router = require('express').Router();

//redirect to the correct address
router.get(['/:id', '/:id/:url','/:id/:url/*', '/:id/*'], function (req, res, next) {
  if(req.baseUrl.length === 2) {
    return next(); //if short address, no redirect.
  }

  var id = req.params.id;
  var url = req.params.url;
  var project = req.ditup.project = req.ditup.project || {};
  var project, expectedUrl;

//first reading the project

  return co(function *() {
    let pr = yield db.project.read(id);

    for(let p in pr) {
      project[p] = pr[p];
    }

    expectedUrl = generateUrl(project.name);

    //redirect to the correct url
    if(expectedUrl !== url) {
      let urlPieces = req.originalUrl.split('/');
      urlPieces[3] = expectedUrl;
      let redirectUrl = urlPieces.join('/');
      return res.redirect(redirectUrl);
    }

    project.url = expectedUrl;
    project.link = req.protocol + '://' + req.headers.host+req.originalUrl; //this is a link for users for copying
    project.id = id;
    return next();
  })
  .catch(function (err) {
    return next(err);
  });
});
