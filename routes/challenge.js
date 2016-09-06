'use strict';

var express = require('express');
var co = require('co');
//var entities = require('entities');
var router = express.Router();
//var validate = require('../services/validation');
var db = require('../services/data');
var functions = require('./collection/functions');
var generateUrl = functions.generateUrl;
var editRoute = require('./challenge/edit');
var postFollowRoute = require('./partial/post-hide-follow');

let showCollection = require('./collection/showCollection');
let postCollection = require('./collection/post');

router.use(editRoute);
router.use(postFollowRoute('challenge'));

router.post(['/:id/:url'], 
  postCollection.checkLogged,
  postCollection.processPost,
  postCollection.processErrors
);

router.all(['/:id/:url', '/:id'], showCollection);

module.exports = router;
