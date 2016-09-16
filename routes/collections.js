'use strict';

var router = require('express').Router();

var getCollections = require('./partial/collections');
var collectionsNew = require('./partial/collections-new');

router.use(getCollections);
router.use(collectionsNew);

module.exports = router;
