'use strict';

var Database = require('arangojs');
var config = require('./db-config');

var url = `http://${config.username}:${config.password}@${config.host}:${config.port}`;
var db = new Database({url: url, databaseName: config.database});

var independentData = require('./independentData');

module.exports = independentData({db: db});
