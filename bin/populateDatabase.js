'use strict';

var Database = require('arangojs');
var config = require('../services/db-config');
var generateUrl = require('../services/generateUrl');
var db = new Database({url: generateUrl(config), databaseName: config.database});

var dbData = require('../test/dbData');
var dbPopulate = require('../test/dbPopulate')(db);

dbPopulate.clear(dbData)
  .then(function () {
    return dbPopulate.populate(dbData);
  })
  .then(null, function (err) {
    console.log(err);
  });
