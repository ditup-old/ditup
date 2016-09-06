'use strict';

var co = require('co');
var router = require('express').Router();
var generateUrl = require('./collection/functions').generateUrl;

var editRoute = require('./discussion/edit');

var postHideFollow = require('./partial/post-hide-follow');

let showCollection = require('./collection/showCollection');
let postCollection = require('./collection/post');

router.use(editRoute);
router.use(postHideFollow('discussion', {}));

router.post('/:id/:url',
  postCollection.checkLogged,
  postCollection.processPost,
  postCollection.processErrors
);

router.all(['/:id/:url', '/:id'], showCollection);


module.exports = router;
