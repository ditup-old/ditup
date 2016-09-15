'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');

var dbData = require('../collection/dbCollection')('project');
let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

var shared = require('../shared');

describe('visiting /project/:id/:url', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let existentProject = dbData.projects[0];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

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
        browser.assert.text('.project-name', existentProject.name);
      });

      it('should show public description', function () {
        browser.assert.text('.project-description', existentProject.description);
      });

      it('should show share link', function () {
        browser.assert.input('.share-link input[readonly]', browser.url);
      });

      it('should show # of followers', function () {
        browser.assert.text('.number-of-followers', String(existentProject.followers.length));
      });

      it('should show link to followers', function () {
        browser.assert.attribute('.link-to-followers', 'href', '/project/' + existentProject.id + '/' + existentProject.url +'/followers');
        browser.assert.text('.link-to-followers', 'followers: ' + String(existentProject.followers.length));
      });

      it('should show # of stars'/*, function () { TODO
        browser.assert.text('#number-of-stars', existentProject.stars.length);
      }*/);
      it('should show link to stargazers'/*, function () { TODO
        browser.assert.link('#link-to-stargazers', existentProject.followers.length, '/project/' + existentProject.id + '/' + existentProject.url +'/stargazers');
      }*/);

      it('should show tags', function () {
        browser.assert.element('.tag-container');
        for(let tag of existentProject.tags) {
          browser.assert.text('.tag', new RegExp('.*'+tag+'.*'));
        }
      });

      it('should show # of members', function () {
        browser.assert.text('.number-of-members', existentProject.members.member.length);
      });

      it('should show status of the project'/*, function () {
        browser.assert.text('#project-status', existentProject.status); //equal to the project status
        browser.assert.text('#project-status', new RegExp('.+')); //not empty
      }*/);//TODO and rethink (status: incubated, running, finished, stopped)

      context('not logged in', function () {

        beforeEach(funcs.logout(browserObj));

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

          beforeEach(funcs.logout(browserObj));
          
          beforeEach(funcs.login(loggedUser, browserObj));

          beforeEach(function (done) {
            browser.visit('/project/' + existentProject.id + '/' + existentProject.url)
              .then(done, done);
          });

          afterEach(funcs.logout(browserObj));
        };

        beforeEach(funcs.login(loggedUser, browserObj));

        beforeEach(function (done) {
          browser.visit('/project/' + existentProject.id + '/' + existentProject.url)
            .then(done, done);
        });

        afterEach(funcs.logout(browserObj));

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
            browser.assert.text(".membership-field", new RegExp('.*[0-9]+member'));
          });
          //copy pasted from shared.js
          it('should show link or field for adding a tag', function () {
            browser.assert.link('.tag-container .edit', '[edit]', '/project/'+existentProject.id+'/'+existentProject.url+'/edit?fields=tags');
          });
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
            browser.assert.attribute('.link-to-members', 'href', '/project/' + existentProject.id + '/' + existentProject.url +'/members');
            browser.assert.text('.link-to-members', 'members: ' + String(existentProject.members.member.length));
          });
          it('should show a link to settings');
          it('should show goals');//later
          it('can contribute to editing');//other file
          it('can contribute to setting a location');//later
          it('can contribute to editing settings');//other file
          it('can contribute to setting status of the project');
        });
      });
    });
  });

  context('project with :id doesn\'t exist', function () {
    it('should show 404 error page');
  });
});
