'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbProfile');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('user settings', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  context('logged in as the same user', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));
    beforeEach(funcs.visit(`/user/${loggedUser.username}/settings`, browserObj));

    it('should be successful', function () {
      browser.assert.success();
      browser.assert.url(`/user/${loggedUser.username}/settings`);
    });
  });
  
  //*
  context('logged in as a different user', function () {
    it('should show 403 - Not Authorized error', funcs.testError(`/user/${loggedUser.username}/settings`, 403, browserObj));
  });

  context('not logged in', function () {
    it('should show 403 - Not Authorized error', funcs.testError(`/user/${loggedUser.username}/settings`, 403, browserObj));
  });
  // */
});
