'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbFollowUser');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
//let co = require('co');

describe('/user/:username follow & unfollow user', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let unfollowedUser = dbData.users[1];
  let followedUser = dbData.users[2];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  function testFollowButton(message) {
    it(message || 'should show \'follow\' button', function () {
      browser.assert.element('.follow-button');
      browser.assert.elements('.unfollow-button', 0);
    });
  }

  function testUnfollowButton(message) {
    it(message || 'should show \'unfollow\' button', function () {
      browser.assert.element('.unfollow-button');
      browser.assert.elements('.follow-button', 0);
    });
  }

  function testNoButton(message, username) {
    username = username || loggedUser.username;
    it(message || 'should not show follow/unfollow button', function () {
      browser.assert.url(`/user/${username}`);
      browser.assert.elements('.follow-button', 0);
      browser.assert.elements('.unfollow-button', 0);
    });
  }

  context('logged in as a different user', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));

    context('not following', function () {
      describe('GET', function () {
        beforeEach(funcs.visit(`/user/${unfollowedUser.username}`, browserObj));

        testFollowButton();
      });

      describe('POST action=follow', function () {
        beforeEach(funcs.fill(`/user/${unfollowedUser.username}`, {submit: 'follow'}, browserObj));

        testUnfollowButton('should create following in database');
      });
    });

    context('following', function () {
      describe('GET', function () {
        beforeEach(funcs.visit(`/user/${followedUser.username}`, browserObj));

        testUnfollowButton();
      });

      describe('POST action=unfollow', function () {
        beforeEach(funcs.fill(`/user/${followedUser.username}`, {submit: 'unfollow'}, browserObj));

        testFollowButton('should remove following from database');
      });
    });
  });

  context('logged in as the same user', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));
    beforeEach(funcs.visit(`/user/${loggedUser.username}`, browserObj));

    testNoButton();
  });

  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    beforeEach(funcs.visit(`/user/${loggedUser.username}`, browserObj));

    testNoButton();
  });
});
