'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require(`./dbProfile`);
let co = require('co');

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

  it('should show a profile picture', function () {
    browser.assert.element('.profile-avatar');
  });

  //*
  it('should show username', function () {
    browser.assert.element('.profile-username');
    browser.assert.text('.profile-username', otherUser.username);
  });
  // */

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    beforeEach(funcs.visit(`/user/${loggedUser.username}`, browserObj));
    afterEach(funcs.logout(browserObj));

    //*
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

    it('should show last active when', function () {
      browser.assert.element('.profile-active');
      browser.assert.text('.profile-active', 'active right now');
    });

    it('should show about', function () {
      browser.assert.element('.profile-about');
      browser.assert.text('.profile-about', 'this is some about text which has multiple lines and is marked with markdown');
    });

    it('should show age', function () {
      browser.assert.element('.profile-age');
      browser.assert.text('.profile-age', '19 years old');
    });

    it('should show gender', function () {
      browser.assert.element('.profile-gender');
      browser.assert.text('.profile-gender', 'male');
    });
    // */

    context('as myself', function () {
      beforeEach(funcs.visit(`/user/${loggedUser.username}`, browserObj));
      it('should show edit links', function () {
        browser.assert.link('.profile-name-edit-link', 'edit name', `/user/${loggedUser.username}/edit?field=name`);
        browser.assert.link('.profile-about-edit-link', 'edit description', `/user/${loggedUser.username}/edit?field=about`);
        browser.assert.link('.profile-birthday-edit-link', 'edit birthday', `/user/${loggedUser.username}/edit?field=birthday`);
        browser.assert.link('.profile-gender-edit-link', 'edit gender', `/user/${loggedUser.username}/edit?field=gender`);
      });
    });

    context('as other user', function () {
      beforeEach(funcs.visit(`/user/${otherUser.username}`, browserObj));
      it('should show follow button', function () {
        browser.assert.element('.follow-button');
      });

      it('should show talk link', function () {
        browser.assert.link('.user-messages-link', 'talk', `/messages/${otherUser.username}`);
      });
    });
  });

  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    beforeEach(funcs.visit(`/user/${otherUser.username}`, browserObj));
    it('should show \'log in to see more\'', function () {
      browser.assert.text('.popup-message', 'log in to see more');
    });
  });

  context('user doesn\'t exist', function () {
    it('should show 404 page', function (done) {
      return co(function * () {
        try {
          yield browser.visit(`/user/nonexistent-user`);
        }
        catch(e) {}
        browser.assert.status(404);
        done();
      }).catch(done);
    });
  });
});
