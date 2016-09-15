'use strict';

let co = require('co');
let router = require('express').Router();
var functions = require('../collection/functions');
var generateUrl = functions.generateUrl;
var editRoutes = require('../collection/edit/edit');

//read the collection
router.use(editRoutes.readCollection);
//test rights to edit
router.use(editRoutes.editRightsMember);

//GET: redirect if necessary TODO

//POST
router.use(editRoutes.post(['name', 'description', 'tags']));

//display the collection-edit view
router.use(editRoutes.displayEditView(['name', 'description', 'tags']));

module.exports = router;
