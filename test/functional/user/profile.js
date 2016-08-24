'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require(`./dbProfile`);

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('profile of a user /user/:username', function () {
  // ********** preparation
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });
  // ***********end of preparation
  //
  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];

  beforeEach(funcs.visit(`/user/${otherUser.username}`, browserObj));

  it('should show a profile picture');
  it('should show username', function () {
    browser.assert.element('.profile-username');
    browser.assert.text('.profile-username', otherUser.username);
  });

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    beforeEach(funcs.visit(`/user/${loggedUser.username}`, browserObj));
    afterEach(funcs.logout(browserObj));
    it('should show name & surname', function () {
      browser.assert.element('.profile-name');
      browser.assert.text('.profile-name', `${loggedUser.profile.name} ${loggedUser.profile.surname}`);
    });
    it('should show tags', function () {
      browser.assert.element('.user-tags');
      browser.assert.elements('.user-tags .tag', dbData.tags.length-1);
    });
    it('should show joined when', function () {
      browser.assert.element('.profile-joined');
      browser.assert.text('.profile-joined', new RegExp('^.*ago$'));
    });
    it('should show number of followers', function () {
      browser.assert.element('.follow-count-followers');
      browser.assert.text('.follow-count-followers', String(dbData.users.length-1));
    });
    it('should show last active when');
    it('should show about');
    it('should show age');
    it('should show gender');

    context('as myself', function () {
      it('should show edit links');
    });

    context('as other user', function () {
      it('should show follow link');
      it('should show talk link');
    });
  });

  context('not logged in', function () {
    it('should show \'log in to see more\'');
  });
});
