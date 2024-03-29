'use strict';

var Database = require('arangojs');
var config = require('../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});

var dbData = require('./dbData');
var dbPopulate = require('./dbPopulate')(db);

dbPopulate.clear(dbData)
  .then(function () {
    return dbPopulate.populate(dbData);
  })
  .then(null, function (err) {
    console.log(err);
  });
