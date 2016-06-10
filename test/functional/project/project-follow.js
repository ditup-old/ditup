'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');

var Database = require('arangojs');
var config = require('../../../services/db-config');//but the app is running on different required db-config!!
var db = new Database({url: config.url, databaseName: config.dbname});
var dbProject = require('../../../services/data/project')(db);
var generateUrl = require('../../../routes/discussion/functions').generateUrl;

var dbData = require('./dbDataProjectFollow');
var dbPopulate = require('../../dbPopulate')(db);
var collections = require('../../../services/data/collections');

let runFollowTest = require('../partial/follow');

let dependencies = {};
let collectionName = 'project';

// use zombie.js as headless browser
var Browser = require('zombie');
describe('visiting /project/:id/:url', function () {
//TODO user, idea, project, project, discussion
  var server, browser;
  var browserObj = {};
  var serverObj = {};

//*********************setting server & browser
  before(function () {
    server = app(session).listen(3000);
    serverObj.Value = server;
    browser = new Browser({ site: 'http://localhost:3000' });
    browserObj.Value = browser;
  });

  after(function (done) {
    server.close(done);
  });
//*******************END*****************

//**************populate database
  before(function (done) {
    dbPopulate.init(collections, config.dbname)
      .then(done, done);
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
//*******************END*****************

//**************shared variables & functions: loggedUser, existentProject, nonexistentProject, login(done), logout(done)
  dependencies.login = function loginUser(user, browserObj) {
    return function login (done) {
      browserObj.Value.visit('/login')
        .then(() => {
          return browserObj.Value.fill('username', user.username)
            .fill('password', user.password)
            .pressButton('log in');
        })
        .then(done, done);
    }
  };
  
  dependencies.logout = function logoutUser (browserObj) {
    return function logout (done) {
      let browser = browserObj.Value;
      browser.visit('/logout')
        .then(done, done);
    }
  };

  dependencies.server = serverObj;
  dependencies.browser = browserObj;
  
  //******************END************************************

  runFollowTest(collectionName, dbData, dependencies);
});
