'use strict';

var router = require('express').Router();

var showCollection = require('./collection/showCollection');
var postCollection = require('./collection/post');

var postFollow = require('./partial/post-follow');
var editRoute = require('./collection/edit');

router.use(editRoute);

router.use(postFollow);

router.post(['/:id/:url'],
  postCollection.checkLogged,
  postCollection.processPost,
  postCollection.processErrors
);

router.all(['/:id/:url', '/:id'], showCollection);

module.exports = router;
