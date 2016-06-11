'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');

var Database = require('arangojs');
var config = require('../../../services/db-config');//but the app is running on different required db-config!!
var db = new Database({url: config.url, databaseName: config.dbname});
var dbProject = require('../../../services/data/idea')(db);
var generateUrl = require('../../../routes/discussion/functions').generateUrl;

var dbData = require('./dbDataIdeas');
var dbPopulate = require('../../dbPopulate')(db);
var collections = require('../../../services/data/collections');

//let runFollowTest = require('../partial/follow');

//let dependencies = {};
//let collectionName = 'idea';

// use zombie.js as headless browser
var Browser = require('zombie');
describe('visiting /ideas', function () {
//TODO user, idea, idea, idea, discussion
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

//**************shared variables & functions
  function loginUser(user, browserObj) {
    return function login (done) {
      browserObj.Value.visit('/login')
        .then(() => {
          return browserObj.Value.fill('username', user.username)
            .fill('password', user.password)
            .pressButton('log in');
        })
        .then(done, done);
    }
  }
  
  function logoutUser (browserObj) {
    return function logout (done) {
      let browser = browserObj.Value;
      browser.visit('/logout')
        .then(done, done);
    }
  }

  function visit (url, browserObj) {
    return function logout (done) {
      let browser = browserObj.Value;
      browser.visit(url)
        .then(done, done);
    }
  }

  //******************END************************************

  //***********tests

  beforeEach(visit('/ideas', browserObj));

  it('should show 5 popular ideas', function () {
    browser.assert.element('.popular-list-followers'); //the list is there
    browser.assert.elements('.popular-list-followers .idea', 5); //there is 5 of them
    browser.assert.text('.popular-list-followers .idea .idea-name', 'idea3idea5idea4idea6idea7'); //the names of ideas are displayed
    browser.assert.link('.popular-list-followers a', 'idea3', new RegExp('/idea/'+dbData.ideas[3].id+'.*')); //links to idea pages
    browser.assert.text('.popular-list-followers li:first-child .followerno', '5 followers');
  });
  it('should show 5 new ideas');
  it('should show 1 random idea');
  it('should show 5 recently active ideas');
  
  context('logged', function () {
    let loggedUser = dbData.users[0];

    beforeEach(logoutUser(browserObj));
    beforeEach(loginUser(loggedUser, browserObj));
    beforeEach(visit('/ideas', browserObj));

    it('should show create new idea button', function () {
      browser.assert.element('.create-new-idea');
      browser.assert.link('.create-new-idea', 'Create a new idea', '/ideas/new');
    });
  });
  context('not logged', function () {
    beforeEach(logoutUser(browserObj));
    beforeEach(visit('/ideas', browserObj));

    it('not show create-new-idea button', function () {
      browser.assert.elements('.create-new-idea', 0);
    });
  });
});
