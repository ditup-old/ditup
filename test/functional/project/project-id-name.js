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

var dbData = require('../../dbData');
var dbPopulate = require('../../dbPopulate')(db);
var collections = require('../../../services/data/collections');

var shared = require('../shared');

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
  
  var existentProject = dbData.projects[0];
  var nonexistentProject = {name: 'nonexistent project', description: 'some description', id: '1234567890'};
  existentProject.url = generateUrl(existentProject.name);
  nonexistentProject.url = generateUrl(nonexistentProject.name);
  //******************END************************************

  //***********testing follow/hide
  //shared.follow('project', {existentCollections: [existentProject], loggedUser: loggedUser}, {data: dbProject, server: serverObj, browser: browserObj}, {nocreate: true});
  //************END

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
        browser.assert.text('#number-of-members', existentProject.members.member.length);
      });

      it('should show status of the project'/*, function () {
        browser.assert.text('#project-status', existentProject.status); //equal to the project status
        browser.assert.text('#project-status', new RegExp('.+')); //not empty
      }*/);//TODO and rethink (status: incubated, running, finished, stopped)

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
        let loginAs = function (status, loggedUser) {
          loggedUser = loggedUser || {};

          beforeEach(function () {
            let mm = existentProject.members[status][0];
            if(mm){
              loggedUser.username = mm.username;
              loggedUser.password = mm.password;
              return;
            }
            throw new Error('there is no member - cannot run this test');
          });

          beforeEach(logout);
          
          beforeEach(loginUser(loggedUser));

          beforeEach(function (done) {
            browser.visit('/project/' + existentProject.id + '/' + existentProject.url)
              .then(done, done);
          });

          afterEach(logout);
        };

        beforeEach(login);

        beforeEach(function (done) {
          browser.visit('/project/' + existentProject.id + '/' + existentProject.url)
            .then(done, done);
        });

        afterEach(logout);

        it('should show follow/hide links', function () {
          throw new Error('fail');
        });
        it('should show star links');
        it('should show public comments');
        it('should show public comment form');
        it('should show location'); //later

        context('user is member', function () {
          loginAs('member');
          it('should show you\'re a member', function () {
            browser.assert.text("#membership-field", new RegExp('.*[0-9]+member'));
          });
          //copy pasted from shared.js
          it('should show link or field for adding a tag', function () {
            browser.assert.element('#add-tag-form');
            browser.assert.attribute('#add-tag-form', 'method', 'post');
            browser.assert.element('#add-tag-form input[type=text]');
            browser.assert.attribute('#add-tag-form input[type=text]', 'name', 'tagname');
            browser.assert.element('#add-tag-form input[type=submit]');
            browser.assert.attribute('#add-tag-form input[type=submit]', 'name', 'submit');
            browser.assert.attribute('#add-tag-form input[type=submit]', 'value', 'add tag');
          }); //' + collection + '/id/name/add-tag
          it('should make removing tags with negative voting possible');//later
          it('should make voting for tags possible');//later
          it('should show an edit link', function () {
            browser.assert.elements('#edit-project-link', 1);
            browser.assert.link('#edit-project-link', 'edit', '/project/'+existentProject.id+'/'+existentProject.url+'/edit');
          });
          it('should show private discussion');
          it('should show form to comment in private discussion');
          it('should show button for deriving a (default: private) challenge/discussion/idea/project');
          it('should show a link to see list of members', function () {
            browser.assert.attribute('#link-to-members', 'href', '/project/' + existentProject.id + '/' + existentProject.url +'/members');
            browser.assert.text('#link-to-members', 'members: ' + String(existentProject.members.member.length));
          });
          it('should show a link to settings');
          it('should show goals');//later
          it('can contribute to editing');//other file
          it('can contribute to setting a location');//later
          it('can contribute to editing settings');//other file
          it('can contribute to setting status of the project');
          it('can contribute to accepting/rejecting joiners');//other file
        });
        context('user is not member', function () {
          context('user is joining', function () {
            loginAs('joining');
            it('should show "cancel join" button', function () {
              return browser.assert.elements('#membership-field #cancel-join-button', 1);
            });
          });
          context('user is invited', function () {
            loginAs('invited');
            it('should show "accept/reject invitation button" button', function () {
              return browser.assert.elements('#membership-field #accept-reject-invite-button', 1);
            });
            it('should show a message that user is invited to this project and can accept or reject the invitation');
          });
          it('[joining possible && didn\'t join] should show "join" button', function () {
            return browser.assert.elements('#membership-field #join-button', 1);
          });
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
