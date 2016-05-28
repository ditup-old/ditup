'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');

var Database = require('arangojs');
var config = require('../../../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});
var dbChallenge = require('../../../services/data/challenge')(db);
var generateUrl = require('../../../routes/discussion/functions').generateUrl;

var shared = require('../shared');

var dbData = require('../../dbData');
var dbPopulate = require('../../dbPopulate')(db);

// use zombie.js as headless browser
var Browser = require('zombie');
describe('testing that tags are working for user, idea, challenge, project, discussion', function () {
//TODO user, idea, challenge, project, discussion
  var server, browser;
  var browserObj = {};
  var serverObj = {};
  
  before(function () {
    server = app(session).listen(3000);
    serverObj.Value = server;
    browser = new Browser({ site: 'http://localhost:3000' });
    browserObj.Value = browser;
  });

  after(function (done) {
    server.close(done);
  });

  before(function (done) {
    dbPopulate.clear()
      .then(done, done);
  });

  beforeEach(function (done) {
    dbPopulate.populate(dbData)
      .then(done, done);
  });

  afterEach(function (done) {
    dbPopulate.clear()
      .then(done, done);
  });

  shared.tags('challenge', {loggedUser: dbData.users[0], existentCollections: dbData.challenges}, {browser: browserObj, server: serverObj});
  shared.tags('discussion', {loggedUser: dbData.users[0], existentCollections: dbData.discussions}, {browser: browserObj, server: serverObj});
  shared.tags('idea', {loggedUser: dbData.users[0], existentCollections: dbData.ideas}, {browser: browserObj, server: serverObj});

});
