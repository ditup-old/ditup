'use strict';

module.exports = function (collectionName) {
  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require(`../${collectionName}/dbFollow`);

  let deps = config.init({db: dbConfig}, dbData);
  let funcs = config.funcs;
  describe('/user/:username follow & unfollow user', function () {
    let browserObj = {};
    let browser;

    let loggedUser = dbData.users[0];
    let unfollowedCollection = dbData[`${collectionName}s`][0];
    let followedCollection = dbData[`${collectionName}s`][1];

    config.beforeTest(browserObj, deps);

    beforeEach(function () {
      browser = browserObj.Value;
    });

    function testFollowButton(message) {
      it(message || 'should show \'follow\' button', function () {
        browser.assert.element('.follow-button');
      });
    }

    function testUnfollowButton(message) {
      it(message || 'should show \'unfollow\' button', function () {
        browser.assert.element('.unfollow-button');
      });
    }

    function testNoButton(message, collection) {
      collection= collection|| unfollowedCollection;
      it(message || 'should not show follow/unfollow button', function () {
        browser.assert.url(`/${collectionName}/${collection.id}/${collection.url}`);
        browser.assert.elements('.follow-button', 0);
        browser.assert.elements('.unfollow-button', 0);
      });
    }

    context('logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));

      context('not following', function () {
        describe('GET', function () {
          beforeEach(funcs.visit(() => `/${collectionName}/${unfollowedCollection.id}/${unfollowedCollection.url}`, browserObj));

          testFollowButton();
        });

        describe('POST action=follow', function () {
          beforeEach(funcs.fill(() => `/${collectionName}/${unfollowedCollection.id}/${unfollowedCollection.url}`, {submit: 'follow'}, browserObj));

          testUnfollowButton('should create following in database');
        });
      });

      context('following', function () {
        describe('GET', function () {
          beforeEach(funcs.visit(() => `/${collectionName}/${followedCollection.id}/${followedCollection.url}`, browserObj));

          testUnfollowButton();
        });

        describe('POST action=unfollow', function () {
          beforeEach(funcs.fill(() => `/${collectionName}/${followedCollection.id}/${followedCollection.url}`, {submit: 'unfollow'}, browserObj));

          testFollowButton('should remove following from database');
        });
      });
    });

    context('not logged in', function () {
      beforeEach(funcs.logout(browserObj));
      beforeEach(funcs.visit(()=>`/${collectionName}/${unfollowedCollection.id}/${unfollowedCollection.url}`, browserObj));

      testNoButton();
    });
  });

};
