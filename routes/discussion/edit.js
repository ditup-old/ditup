'use strict';

let co = require('co');
let router = require('express').Router();
var functions = require('../collection/functions');
var generateUrl = functions.generateUrl;
var editRoutes = require('../collection/edit');

//read the collection
router.use(editRoutes.readCollection);
//test rights to edit
router.use(editRoutes.editRightsCreator);

//POST
router.use(editRoutes.post(['name', 'tags']));

//GET: redirect if necessary TODO

//display the collection-edit view
router.use(editRoutes.displayEditView(['name', 'tags']));

module.exports = router;
