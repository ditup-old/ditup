'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbMessages');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('messages', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  describe('/messages', function () {

    context('not logged in', function () {
      beforeEach(funcs.logout(browserObj));

      it('should return status 403 not authorized', function (done) {
        co(function *() {
          try {
            yield browser.visit('/messages');
          }
          catch(e) {}

          browser.assert.status(403);

          return done();
        })
        .catch(function (err) {
          return done(err);
        });
      });
    });

    context('logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));

      beforeEach(funcs.visit('/messages', browserObj));

      it('should be successful', function () {
        browser.assert.success();
      });

      it('should show list of last messages from different people of logged user', function () {
        browser.assert.elements('.last-user-message', 1);
      });

      it('the unviewed messages should be highlighted', function () {
        browser.assert.elements('.last-user-message.unseen', 1);
      });
    });
  });

  describe('header of all logged pages', function () {
    context('logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));
      beforeEach(funcs.visit('/projects', browserObj));
      it('should show notification about unread messages next to messages icon', function () {
        browser.assert.text('.unread-messages-count', 3);
      });
    })
  });

  describe('/user/username', function () {
    context('logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));
      context('page of other user than me', function () {
        beforeEach(funcs.visit('/user/' + otherUser.username, browserObj));
        it('should show icon \'write a message to the user\'', function () {
          browser.assert.element('a.write-message[href="/messages/'+otherUser.username+'"]');
        });
      });
    });
  });
});
