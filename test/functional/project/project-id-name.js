'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');

var Database = require('arangojs');
var config = require('../../../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});
var dbProject = require('../../../services/data/project')(db);
var generateUrl = require('../../../routes/discussion/functions').generateUrl;

var dbData = require('../../dbData');
var dbPopulate = require('../../dbPopulate')(db);

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
  var loggedUser = dbData.users[0];

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
  
  var existentProject = dbData.projects[0];
  var nonexistentProject = {name: 'nonexistent project', description: 'some description', id: '1234567890'};
  existentProject.url = generateUrl(existentProject.name);
  nonexistentProject.url = generateUrl(nonexistentProject.name);
  //******************END************************************

  context('project with :id exists', function () {
    context(':id not fitting to :url', function () {
      it('should permanent redirect to the correct url', function (done) {
        browser.visit('/project/' + existentProject.id + '/' + 'random-url')
          .then(function () {
            browser.assert.success();
            browser.assert.redirected();
            browser.assert.url(new RegExp('^.*/project/'+ existentProject.id + '/' + existentProject.url + '/?$'));
          })
          .then(done, done);
      });
    });

    context(':id without :url', function () {
      it('should permanent redirect to the correct url', function (done) {
        browser.visit('/project/' + existentProject.id)
          .then(function () {
            browser.assert.success();
            browser.assert.redirected();
            browser.assert.url(new RegExp('^.*/project/'+ existentProject.id + '/' + existentProject.url + '/?$'));
          })
          .then(done, done);
      });
    });

    context(':id and :name are valid', function () {
      beforeEach(function (done) {
        browser.visit('/project/' + existentProject.id + '/' + existentProject.url)
          .then(done, done);
      });

      it('should show name', function () {
        browser.assert.text('#project-name', existentProject.name);
      });

      it('should show public description', function () {
        browser.assert.text('#project-description', existentProject.description);
      });

      it('should show share link', function () {
        browser.assert.input('input#share-link[readonly]', browser.url);
      });

      it('should show # of followers', function () {
        browser.assert.text('#number-of-followers', String(existentProject.followers.length));
      });

      it('should show link to followers', function () {
        browser.assert.attribute('#link-to-followers', 'href', '/project/' + existentProject.id + '/' + existentProject.url +'/followers');
        browser.assert.text('#link-to-followers', 'followers: ' + String(existentProject.followers.length));
      });

      it('should show # of stars'/*, function () { TODO
        browser.assert.text('#number-of-stars', existentProject.stars.length);
      }*/);
      it('should show link to stargazers'/*, function () { TODO
        browser.assert.link('#link-to-stargazers', existentProject.followers.length, '/project/' + existentProject.id + '/' + existentProject.url +'/stargazers');
      }*/);

      it('should show tags', function () {
        browser.assert.element('#project-tags');
        for(let tag of existentProject.tags) {
          browser.assert.text('.tag', new RegExp('.*'+tag+'.*'));
        }
      });

      it('should show # of members', function () {
        browser.assert.text('#number-of-members', existentProject.members.length);
      });
      it('should show status of the project', function () {
        browser.assert.text('#project-status');
      });

      context('not logged in', function () {

        beforeEach(logout);

        beforeEach(function (done) {
          return browser.visit('/project/' + existentProject.id + '/' + existentProject.url)
            .then(done, done);
        });

        it('should suggest logging in or signing up with proper redirect in link', function () {
          var redirect = '/login?redirect=%2Fproject%2F' + existentProject.id + '%2F' + existentProject.url;
          browser.assert.success();
          browser.assert.text('div.popup-message.info', 'log in or sign up to read more and contribute');
          browser.assert.link('div.popup-message.info a', 'log in', redirect);
          browser.assert.link('div.popup-message.info a', 'sign up', '/signup');
          browser.assert.attribute('#login-form', 'action', redirect);
        });

        it('should not show join button', function () {
          browser.assert.elements('#join-button', 0);
        });
        it('should not show follow/hide links');
        it('should not show a star link');
        it('should not show public comments');
      });

      context('logged in', function () {
        beforeEach(login);

        beforeEach(function (done) {
          browser.visit('/project/' + existentProject.id + '/' + existentProject.url)
            .then(done, done);
        });

        afterEach(logout);

        it('should show follow/hide links');
        it('should show star links');
        it('should show public comments');
        it('should show public comment form');
        it('should show location');

        context('user is member', function () {
          it('should show you\'re a member');
          it('should make adding tags possible');
          it('should make removing tags with negative voting possible');
          it('should make voting for tags possible');
          it('should show an edit link');
          it('should show private discussion');
          it('should show form to comment in private discussion');
          it('should show button for deriving a (default: private) challenge/discussion/idea/project');
          it('should show a link to see list of members');
          it('should show a link to setting');
          it('should show goals');
          it('can contribute to editing');
          it('can contribute to setting a location');
          it('can contribute to editing settings');
          it('can contribute to setting status of the project');
          it('can contribute to accepting/rejecting joiners');

        });
        context('user is not member', function () {
          it('[joining possible && didn\'t join] should show "join" button');
          it('[joining possible && request pending] should show "cancel joining" button');
          it('[joining not possible] should show info that joining is not possible');
          it('[joining not possible] should not show join button');
        });
      });
    });
  });

  context('project with :id doesn\'t exist', function () {
    it('should show 404 error page');
  });
});
