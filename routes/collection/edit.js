'use strict';

let co = require('co');
let router = require('express').Router();
var functions = require('./functions');
var generateUrl = functions.generateUrl;
var editRoutes = require('./edit/edit');

//read the collection
router.use(editRoutes.readCollection);
//test rights to edit
router.use(editRoutes.editRightsCreator);

//POST
router.use(editRoutes.post(['name', 'description', 'tags']));

//GET: redirect if necessary TODO

//display the collection-edit view
router.use(editRoutes.displayEditView(['name', 'description', 'tags']));

module.exports = router;
