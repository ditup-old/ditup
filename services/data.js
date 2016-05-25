'use strict';

var Database = require('arangojs');
var config = require('./db-config');
var db = new Database({url: config.url, databaseName: config.dbname});

var independentData = require('./independentData');

module.exports = independentData({db: db});
