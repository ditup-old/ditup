'use strict';

require('./profile-pages')('followers');

/*
//testing the page /user/:username/followers
//
let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbNavigation');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('visit /user/:username/followers', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));
    beforeEach(funcs.visit(`/user/${otherUser.username}/followers`, browserObj));

    //every second user follows the otherUser
    //every third user is followed by the otherUser
    let userno = dbData.users.length;
    let followerno = Math.ceil(userno / 2);
    let followingno = Math.ceil(userno / 3);

    it('should show a header: Followers', function () {
      browser.assert.text('.user-followers-header', 'Followers');
    });
    it('should show a list of followers of the user', function () {
      browser.assert.element('.user-followers-list');
      browser.assert.elements('.user-follower', followerno);
    });
  });

  context('not logged in', function () {
    it('should show 403 Not Authorized page', funcs.testError(`/user/${otherUser.username}/followers`, 403, browserObj));
  });
});
*/
