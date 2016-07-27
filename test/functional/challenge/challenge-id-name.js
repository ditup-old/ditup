'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbDataChallenges');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('visit /challenge/:id/:name', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];
  let creator = dbData.users[2];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  var existentChallenge = dbData.challenges[0];

  context('challenge with :id exists', function () {
    context(':id not fitting to :name', function () {
      beforeEach(funcs.visit(()=>`/challenge/${existentChallenge.id}/random-url`, browserObj));

      it('should permanent redirect to the correct name', function () {
        browser.assert.success();
        browser.assert.redirected();
        browser.assert.url(`/challenge/${existentChallenge.id}/${existentChallenge.url}`);
      });
    });

    context(':id without :name', function () {
      beforeEach(funcs.visit(()=>`/challenge/${existentChallenge.id}`, browserObj));

      it('should permanent redirect to the correct name', function () {
        browser.assert.success();
        browser.assert.redirected();
        browser.assert.url(`/challenge/${existentChallenge.id}/${existentChallenge.url}`);
      });
    });

    context(':id and :name are valid', function () {
      beforeEach(funcs.visit(()=>`/challenge/${existentChallenge.id}/${existentChallenge.url}`, browserObj));

      it('should show the challenge name and description', function () {
        browser.assert.text('.challenge-name', existentChallenge.name);
        browser.assert.text('.challenge-description', existentChallenge.description);
      });

      it('should show activity log');

      it('should show stars')
      it('should show the challenges, tags, followers, stars, etc.');
      context('not logged in', function () {

        beforeEach(funcs.logout(browserObj));

        beforeEach(function (done) {
          return browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
            .then(done, done);
        });

        it('should suggest logging in or signing up with proper redirect in link', function () {
          var redirect = '/login?redirect=%2Fchallenge%2F' + existentChallenge.id + '%2F' + existentChallenge.url;
          browser.assert.success();
          browser.assert.text('div.popup-message.info', 'log in or sign up to read more and contribute');
          browser.assert.link('div.popup-message.info a', 'log in', redirect);
          browser.assert.link('div.popup-message.info a', 'sign up', '/signup');
          browser.assert.attribute('#login-form', 'action', redirect);
        });
      });

      context('logged in', function () {
        beforeEach(funcs.login(loggedUser, browserObj));
        beforeEach(funcs.visit(()=>`/challenge/${existentChallenge.id}/${existentChallenge.url}`, browserObj));
        afterEach(funcs.logout(browserObj));

        //challenge/id/name/add-tag

        it('should show buttons for launching idea, project, discussion, challenge...');
        it('may make it possible to link existent ideas, projects, discussions, challenges');
        it('may be possible to edit the challenge name and description in wikipedia or etherpad style');

        context('user is creator', function () {
          beforeEach(funcs.logout(browserObj));
          beforeEach(funcs.login(creator, browserObj));
          beforeEach(funcs.visit(()=>`/challenge/${existentChallenge.id}/${existentChallenge.url}`, browserObj));
          afterEach(funcs.logout(browserObj));
          it('may be possible to delete the challenge if not embraced'); //challenge/id/name/delete //discourage!
          it('may be possible for the creator to remove their name (anonymization)');
          context('editing', function () {
            it('should show an edit button', function () {
              browser.assert.element('.edit-challenge');
              browser.assert.link('a.edit-challenge', 'edit', 'edit');
            });

            context('challenge editing page', function () {
            
            });
          });
          it('may edit the challenge name');
          it('may edit the challenge description');
        });
        
        context('user is not a creator', function () {});
      });
    });

    context('POST', function () {
      context('logged in', function () {

        beforeEach(funcs.login(loggedUser, browserObj));

        beforeEach(function (done) {
          browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
            .then(done, done);
        });

        afterEach(funcs.logout(loggedUser, browserObj));

        function pressJustAButton(buttonName) {
          return function (done) {
            return browser
              .pressButton(buttonName)
              .then(done, done);
          };
        }
      });
      context('not logged in', function () {
        //i'm not able to write this test: i.e. fill the form and then logout and then post it. but it should work.
        /*
        beforeEach(login)
        beforeEach(logout);

        beforeEach(function (done) {
          browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
            .then(done, done);
        });

        afterEach(logout);
        */
        it('should show error that user needs to log in to perform any editing'/*, function () {
          let redirect = '/login?redirect=%2Fchallenge%2F' + existentChallenge.id + '%2F' + existentChallenge.url;
          browser.assert.text('div.popup-message.info', new RegExp('You need to log in to POST anything.'));
          browser.assert.link('div.popup-message.info a', 'log in', redirect);
        }*/);
      });
    });
  });

  context('challenge with :id doesn\'t exist', function () {
    it('should show 404 error page');
  });
});
