'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbNavigation');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('/user/:username navigation', function () {
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
    beforeEach(funcs.visit(`/user/${otherUser.username}`, browserObj));
    
    it('should show the navigation panel', function () {
      browser.assert.element('.user-pages-nav');
    });
    it('should show Followers link in the navigation panel', function () {
      browser.assert.element('.user-followers-link');
      browser.assert.attribute('.user-followers-link', 'href', `/user/${otherUser.username}/followers`);
    });
    it('should show Following link in the navigation panel', function () {
      browser.assert.element('.user-following-link');
      browser.assert.attribute('.user-following-link', 'href', `/user/${otherUser.username}/following`);
    });

    //every second user follows the otherUser
    //every third user is followed by the otherUser
    let userno = dbData.users.length;
    let followerno = Math.ceil(userno / 2);
    let followingno = Math.ceil(userno / 3);

    it('should show a correct number of followers in the navigation panel', function () {
      browser.assert.text('.user-followers-number', followerno);
    });
    it('should show a correct number of following in the navigation panel', function () {
      browser.assert.text('.user-following-number', followingno);
    });
  });
});
