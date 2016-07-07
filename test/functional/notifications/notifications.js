'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbNotifications');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('notifications', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  describe('/notifications', function () {

    context('not logged in', function () {
      beforeEach(funcs.logout(browserObj));

      it('should return status 403 not authorized', function (done) {
        co(function *() {
          try {
            yield browser.visit('/notifications');
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

      beforeEach(funcs.visit('/notifications', browserObj));

      it('should be successful', function () {
        browser.assert.success();
      });

      it('should show list of notifications for logged user', function () {
        browser.assert.elements('.notification', 1);
      });

      it('the unviewed notifications should be highlighted', function () {
        browser.assert.elements('.notification.unviewed', 1);
      });

      it('when notification is clicked, it should make it viewed and redirect to the right url to process it');
      it('when notification cross is clicked, it should delete it');
      it('should show link to edit notification settings');
    });
  });

  describe('header of all logged pages', function () {
    context('logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));
      beforeEach(funcs.visit('/projects', browserObj));
      it('should show number of unviewed notifications next to notifications icon', function () {
        browser.assert.text('.unviewed-notifications-count', 3);
      });
    })
  });
});
