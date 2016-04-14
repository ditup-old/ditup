'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'test';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');
// use zombie.js as headless browser
var Browser = require('zombie');

var Database = require('arangojs');
var config = require('../../../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});
var dbChallenge = require('../../../services/data/challenge')(db);

describe('visiting /challenges/new', function () {
  var server, browser;

  before(function () {
    server = app(session).listen(3000);
    browser = new Browser({ site: 'http://localhost:3000' });
  });

  after(function (done) {
    server.close(done);
  });

  context('not logged', function () {
    beforeEach(function (done) {
      return browser.visit('/logout')
        .then(done, done);
    });

    context('GET', function () {
      it('should offer logging in', function (done) {
        return browser.visit('/challenges/new')
          .then(function () {
            return Promise.all([
              browser.assert.success(),
              browser.assert.text('div.popup-message.info', 'you need to log in to create a new challenge'),
              browser.assert.link('div.popup-message.info a', 'log in', '/login?redirect=%2Fchallenges%2Fnew'),
              browser.assert.text('#login-form label', 'usernamepassword')
            ])
            .then(function () {});
          })
          .then(done, done);
      });
    });
    context('POST', function () {
      it('should show an error: you are not logged in');
    });
  });

  context('logged', function () {
    context('GET', function () {
      it('should show the form for creating a challenge');
      /**
       * field for name
       * field for description
       * create button
       * field for adding tags
       */
    });
    context('POST', function () {
      context('bad data', function () {
        it('should complain with proper errors and show the form again and form filled with the already submitted data');
      });
      context('good data', function () {
        it('should create the challenge and redirect to it');
      });
    });
  });
});
