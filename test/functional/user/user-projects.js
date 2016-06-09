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

var dbData = require('./dbUserProjects');
var dbPopulate = require('../../dbPopulate')(db);
var collections = require('../../../services/data/collections');

var shared = require('../shared');

// use zombie.js as headless browser
var Browser = require('zombie');

describe('visit /user/:username/projects', function () {
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
  function loginUser(user) {
    return function login (done) {
      browser.visit('/login')
        .then(() => {
          return browser.fill('username', user.username)
            .fill('password', user.password)
            .pressButton('log in');
        })
        .then(done, done);
    }
  }

  function logout (done) {
    browser.visit('/logout')
      .then(done, done);
  }

  context('logged in', function () {
    let loggedUser = dbData.users[1];
    beforeEach(loginUser(loggedUser));

    beforeEach(function (done) {
      return browser.visit('/user/' + loggedUser.username + '/projects')
        .then(done, done);
    });

    afterEach(logout);

    context('the logged user is :username', function () {
      it('should be successful', function () {
        browser.assert.success();
      });
      it('should show list of projects user is involved in (member/invited/joining)', function () {
        browser.assert.element('.involved-list');
        browser.assert.text('.involved-list .project .project-name', new RegExp('(?=.*project0)(?=.*project1)(?=.*project2)'));
        browser.assert.attribute('.involved-list .project-link.project-id-'+dbData.projects[0].id, 'href', new RegExp('^/project/'+dbData.projects[0].id+'.*$'));
        browser.assert.text('.involved-list .project-involvement', new RegExp('(?=.*joining)(?=.*invited)(?=.*member)'));
      });
      it('should show list of projects user follows', function () {
        browser.assert.element('.following-list');
        browser.assert.text('.following-list .project .project-name', new RegExp('(?=.*project1)'));
        browser.assert.attribute('.following-list .project-link.project-id-'+dbData.projects[1].id, 'href', new RegExp('^/project/'+dbData.projects[1].id+'.*$'));
      });
      it('should show list of projects which have common tags with user (sorted by amount of common tags)', function () {
        browser.assert.element('.common-tags-list');
        browser.assert.text('.common-tags-list .project .project-name', new RegExp('(?=.*project1)'));
        browser.assert.attribute('.common-tags-list li:first-child .project-link', 'href', new RegExp('^/project/'+dbData.projects[1].id+'.*$'));
        browser.assert.text('.common-tags-list li:first-child .common-tagno', '2 tags');
        let tagRegex = '';
        for(let tg of dbData.projects[1].tags) {
          tagRegex += '(?=.*'+tg+')';
        }
        browser.assert.attribute('.common-tags-list li:first-child .common-tagno', 'title', new RegExp(tagRegex));
        browser.assert.attribute('.common-tags-list li:first-child .common-tagno', 'data-tooltip', new RegExp(tagRegex));
      });
    });
    context('the logged user is not :username', function () {
      it('we should define what should happen');
    });
  });
  context('not logged in', function () {
    it('should ask to log in to continue');
  });
});
