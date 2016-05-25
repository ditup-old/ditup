'use strict';

//set things up

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module
var app = require('../../app');
var session = require('../../session');

var Database = require('arangojs');
var config = require('../../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});
//var dbUser = require('../../services/data/user')(db);

// use zombie.js as headless browser
var Browser = require('zombie');

//the tests themselves
describe('signup', function () {

  var newUser = {
    username: 'new-user',
    password: 'asdfasdf',
    email: 'michal.salajka@protonmail.com'
  };
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

  var loggedUser = {username: 'test1', password: 'asdfasdf'};

  function login (done) {
    browser.visit('/login')
      .then(() => {
        return browser.fill('username', loggedUser.username)
          .fill('password', loggedUser.password)
          .pressButton('log in');
      })
      .then(done, done);
  }

  function logout (done) {
    browser.visit('/logout')
      .then(done, done);
  }

  context('not logged in', function () {
    beforeEach(logout);

    context('GET', function () {
      it('should show a signup form', function (done) {
        browser.visit('/signup')
          .then(function () {
            browser.assert.success();
            browser.assert.element('form#signup-form');
          })
          .then(done, done);
      });
    });

    context('POST', function () {
      beforeEach(function (done) {
        browser.visit('/signup')
          .then(done, done);
      });
      context('valid data', function () {
        beforeEach(function (done) {
          browser
            .fill('username', newUser.username)
            .fill('email', newUser.email)
            .fill('password', newUser.password)
            .fill('password2', newUser.password)
            .pressButton('sign up')
            .then(done, done);
        });

        afterEach(function (done) {
          db.query('FOR u IN users FILTER u.username == @username REMOVE u IN users', {username: newUser.username})
            .then(function () {})
            .then(done, done);
        });

        it('should make user and save her to database');
        it('should save only hash and salt of password');
        it('should log in and show welcoming message', function () {
          browser.assert.success();
        });
      });

      context('invalid data', function () {
        it('should ')
        context('bad format', function () {
          it('should show correct errors');
        });
        context('duplicate email or username', function () {
          it('should show correct errors');
        });
      });
    });
  });

  context('logged in', function () {
    beforeEach(logout);
    beforeEach(login);
    afterEach(logout);
    beforeEach(function (done) {
      browser.visit('/signup')
        .then(done, done);
    });
    it('should say that user needs to log out first (with link in "log out")', function () {
      browser.assert.success();
      browser.assert.text('div.popup-message.info', 'you are logged in as ' + loggedUser.username + '. To sign up you need to log out first.');
      browser.assert.link('div.popup-message.info a', 'log out', '/logout');
    });
  });
});
