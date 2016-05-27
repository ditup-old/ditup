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
var dbProject = require('../../../services/data/project')(db);

var dbData = require('../../dbData');
var dbPopulate = require('../../dbPopulate')(db);

describe('visiting /projects/new', function () {
  var server, browser;
  
  var loggedUser = dbData.users[0];

// ** running server and browser
  before(function () {
    server = app(session).listen(3000);
    browser = new Browser({ site: 'http://localhost:3000' });
  });

  after(function (done) {
    server.close(done);
  });
// ** END running server and browser

// ** preparing the database
  before(function (done) {
    dbPopulate.clear(dbData)
      .then(done, done);
  });

  beforeEach(function (done) {
    dbPopulate.populate(dbData)
      .then(done, done);
  });

  afterEach(function (done) {
    dbPopulate.clear(dbData)
      .then(done, done);
  });
// ** END preparing the database

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

  context('not logged', function () {
    beforeEach(logout);

    context('GET', function () {
      it('should offer logging in', function (done) {
        return browser.visit('/projects/new')
          .then(function () {
            return Promise.all([
              browser.assert.success(),
              browser.assert.text('div.popup-message.info', 'you need to log in to create a new project'),
              browser.assert.link('div.popup-message.info a', 'log in', '/login?redirect=%2Fprojects%2Fnew'),
              browser.assert.text('#login-form label', 'usernamepassword')
            ])
            .then(function () {});
          })
          .then(done, done);
      });
    });

    context('POST', function () {
      it('should show an error: you are not logged in', function (done) {
        return browser.visit('/projects/new')
          .then(function () {
            return Promise.all([
              browser.assert.success(),
              browser.assert.text('div.popup-message.info', 'you need to log in to create a new project'),
              browser.assert.link('div.popup-message.info a', 'log in', '/login?redirect=%2Fprojects%2Fnew')
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
      browser.visit('/projects/new')
        .then(done, done);
    });

    context('GET', function () {
      it('should show the form for creating a project', function () {
        /**
         * field for name
         * field for description
         * create button
         * field for adding tags
         */
          browser.assert.success();
          browser.assert.text('h1', 'Create a new project');
          browser.assert.text('form#new-project label', 'namepublic descriptionjoining possible?yesnoyesnoinfo for people who want to join');
          browser.assert.elements('form#new-project input[type=radio]',2);
          browser.assert.attribute('form#new-project input[type=radio]', 'name', 'joining');
          browser.assert.element('form#new-project textarea[name=description]');
          browser.assert.element('form#new-project input[name=name]');
          browser.assert.element('form#new-project textarea[name=join-info]');
          browser.assert.element('form#new-project input[type=radio][value=yes]');
          browser.assert.element('form#new-project input[type=radio][value=no]');
          browser.assert.element('form#new-project input[type=submit]');
          browser.assert.attribute('form#new-project input[type=submit]', 'value', 'create the project');
          browser.assert.attribute('form#new-project', 'method', 'post');
      
      });
    });

    context('POST', function () {
      var validName = 'project name';
      var emptyName = '';
      var longName = 'name'; //more than 1024 characters
      for (let i = 0; i<10; ++i) {
        longName += longName;
      }

      var validDescription = 'this is a valid description of the project name';
      var emptyDescription = '';
      var longDescription = '01234567'; //more than 16384 characters
      for (let i = 0; i<12; ++i) {
        longDescription += longDescription;
      }

      var validTags = 'hitch-hiking, test-tag-1';
      var badlyFormattedTags = 'test tag 1, tag2, hitch-hikin^^g';
      var emptyTags = '';

      function submitForm (name, description, joining, joinInfo) {
        return browser.visit('/projects/new')
          .then(() => {
            return browser
              .fill('name', name)
              .fill('description', description)
              .fill('join-info', joinInfo)
              .pressButton('create the project');
          });
      }

      function fillForm (name, description, joining, joinInfo) {
        return function (done) {
          return submitForm(name, description, joining, joinInfo)
            .then(done, done);
        }
      }

      context('bad data', function () {

        function badDataTestCreator(name, description, joining, joinInfo, message) {
          return function () {

            beforeEach(fillForm(name, description, joining, joinInfo));

            it('should return a form with a proper error', function () {
              browser.assert.success();
              browser.assert.text('h1', 'Create a new project');
              browser.assert.element('form#new-project');
              browser.assert.text('div.popup-message.info', new RegExp('^.*' + message + '.*$'));
            });

            it('should keep other fields filled', function () {
              browser.assert.input('textarea[name=description]', description);
              browser.assert.input('input[name=name]', name);
            });
          };
        };

        context('empty name', badDataTestCreator(emptyName, validDescription, 'yes', '', 'you need to write a name'));

        context('too long name', badDataTestCreator(longName, validDescription, 'yes', '', 'the name is too long'));

        context('too long description', badDataTestCreator(validName, longDescription, 'yes', '', 'the description is too long'));

      });


      context('good data', function () {

        let createdProjectId; //for later deleting it
        let validWeirdName = 'What is a ))_??#@#:@ purpose of test?';

        beforeEach(function (done) {
          browser.visit('/projects/new')
            .then(() => {
              return browser
                .fill('name', validWeirdName)
                .fill('description', validDescription)
                .fill('joining', 'no')
                .fill('join-info', '')
                .pressButton('create the project');
            })
            .then(() => {
              let url = browser.url;
              let arr = url.split('/');
              createdProjectId = arr[4];
            })
            .then(done, done);
        
        });

        it('should be successful', function () {
          browser.assert.success();
        });

        it('should redirect', function () {
          browser.assert.redirected();
        });

        it('should redirect to the created project', function () {
          browser.assert.url(/^.*\/project\/[0-9]*\/what-is-purpose-of-test\/?$/);
        });
      });
    });
  });
});
