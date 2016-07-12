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
        .catch(done);
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
        browser.assert.elements('.notification', 3);
      });

      it('the unviewed notifications should be highlighted', function () {
        browser.assert.elements('.notification.unviewed', 3);
      });

      it('when notification is clicked, it should make it viewed and redirect to the right url to process it', function (done) {
        return co(function *() {
          yield browser.pressButton('process-notification');
          browser.assert.redirected();
          browser.assert.url('/projects');
          done();
        })
        .catch(done);
      });
      it('when notification cross is clicked, it should delete it', function (done) {
        return co(function *() {
          yield browser.pressButton('delete');
          browser.assert.success();
          browser.assert.elements('.notification', 2);
          done();
        })
        .catch(done);
      });
      it('should show link to edit user notification settings');
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

  describe('system creates the notification', function () {
    //we want to have a module notify(username, text, url);
    context('user is accepted to a project', function () {
      beforeEach(funcs.login(otherUser, browserObj));
      beforeEach(function (done) {
        //accept the other user to the project
        co(function *(){
            done();
        })
          .catch(done);
      });
      beforeEach(funcs.logout(browserObj));
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));
      it('should show a higher number of notifications', function () {
        browser.assert.text('.unviewed-notifications-count', 4);
      });
      it('on the notifications page, there should be this notification present', function () {
        
      });
    });
  });
});
