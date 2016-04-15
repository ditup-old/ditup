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

  function login (done) {
    browser.visit('/login')
      .then(() => {
        return browser.fill('username', 'test1')
          .fill('password', 'asdfasdf')
          .pressButton('log in');
      })
      .then(done, done);
  }

  function logout (done) {
    browser.visit('/logout')
      .then(done, done);
  }

  context('not logged', function () {
    beforeEach(logout);

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
      it('should show an error: you are not logged in', function (done) {
        return browser.visit('/challenges/new')
          .then(function () {
            return Promise.all([
              browser.assert.success(),
              browser.assert.text('div.popup-message.info', 'you need to log in to create a new challenge'),
              browser.assert.link('div.popup-message.info a', 'log in', '/login?redirect=%2Fchallenges%2Fnew')
            ])
            .then(function () {});
          })
          .then(done, done);
      });
    });
  });

  context('logged', function () {

    beforeEach(login);
    afterEach(logout);

    beforeEach(function (done) {
      browser.visit('/challenges/new')
        .then(done, done);
    });

    context('GET', function () {
      it('should show the form for creating a challenge', function () {
        /**
         * field for name
         * field for description
         * create button
         * field for adding tags
         */
          browser.assert.success();
          browser.assert.text('h1', 'Create a new challenge');
          browser.assert.text('form#new-challenge label', 'nametagsdescription');
          browser.assert.element('form#new-challenge input[type=submit]');
          browser.assert.attribute('form#new-challenge input[type=submit]', 'value', 'create the challenge');
          browser.assert.attribute('form#new-challenge', 'method', 'post');
      
      });
    });

    context('POST', function () {
      var validName = 'challenge name';
      var emptyName = '';
      var longName = 'name'; //more than 1024 characters
      for (let i = 0; i<10; ++i) {
        longName += longName;
      }

      var validDescription = 'this is a valid description of the challenge name';
      var emptyDescription = '';
      var longDescription = '01234567'; //more than 16384 characters
      for (let i = 0; i<12; ++i) {
        longDescription += longDescription;
      }

      var validTags = 'hitch-hiking, test-tag-1';
      var badlyFormattedTags = 'test tag 1, tag2, hitch-hikin^^g';
      var emptyTags = '';

      function fillForm (name, description, tags) {
        return function (done) {
          browser.visit('/challenges/new')
            .then(() => {
              return browser
                .fill('name', name)
                .fill('description', description)
                .fill('tags', tags)
                .pressButton('create the challenge');
            })
            .then(done, done);
        }
      }

      context('bad data', function () {

        function badDataTestCreator(name, description, tags, message) {
          return function () {

            beforeEach(fillForm(name, description, tags));

            it('should return a form with a proper error', function () {
              browser.assert.success();
              browser.assert.text('h1', 'Create a new challenge');
              browser.assert.element('form#new-challenge');
              browser.assert.text('div.popup-message.info', new RegExp('^.*' + message + '.*$'));
            });

            it('should keep other fields filled', function () {
              browser.assert.input('input[name=tags]', tags);
              browser.assert.input('textarea[name=description]', description);
              browser.assert.input('input[name=name]', name);
            });
          };
        };

        context('empty name', badDataTestCreator(emptyName, validDescription, validTags, 'you need to write a name'));

        context('too long name', badDataTestCreator(longName, validDescription, validTags, 'the name is too long'));

        context('empty description', badDataTestCreator(validName, emptyDescription, validTags, 'you need to write a description'));

        context('too long description', badDataTestCreator(validName, longDescription, validTags, 'the description is too long'));

        it('should refuse too many tags');
        it('should refuse non-existent tags');

        context('no tags', badDataTestCreator(validName, validDescription, emptyTags, 'you need to choose 1 or more tags'));
        context('badly formatted tags', badDataTestCreator(validName, validDescription, badlyFormattedTags, '^.*the tags .* are badly formatted$'));
      });


      context('good data', function () {
        it('should create the challenge and redirect to it');
      });
    });
  });
});
