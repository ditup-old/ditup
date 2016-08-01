'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbPeople');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('/people', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  beforeEach(funcs.visit('/people', browserObj));

  it('should show number of people who are active and email verified', function () {
    browser.assert.element('.number-of-people');
    browser.assert.text('.number-of-people', `There are ${dbData.users.length} active people registered`);
    browser.assert.text('.number-of-people .count', dbData.users.length);
  });

  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    beforeEach(funcs.visit('/people', browserObj));

    it('should say that more can be seen after login, and link to correct redirect login page', function () {
      browser.assert.text('.popup-message', 'log in to see more');
      browser.assert.url('.popup-message a', 'log in', '/login?redirect=');
    });
    it('should not show the other lists', function () {
      browser.assert.elements('.common-tags-users-list', 0);
      browser.assert.elements('.new-users-list', 0);
      browser.assert.elements('.random-users-list', 0);
      browser.assert.elements('.last-online-users-list', 0);
      browser.assert.elements('.popular-users-list', 0);
    });
  });

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser,browserObj));
    beforeEach(funcs.visit('/people', browserObj));
    afterEach(funcs.logout(browserObj));

    it('show list of people with common tags with me', function () {
      browser.assert.element('.common-tags-users-list');
      browser.assert.elements('.common-tags-users-list li', 5);
    });

    it('show list of new users', function () {
      browser.assert.element('.new-users-list');
      browser.assert.elements('.new-users-list li', 5);
    });

    it('random user', function () {
      browser.assert.element('.random-users-list');
      browser.assert.elements('.random-users-list li', 1);
    });

    it('last online people', function () {
      browser.assert.element('.last-online-users-list');
      browser.assert.elements('.last-online-users-list li', 5);
    });

    it('most followed people', function () {
      browser.assert.element('.popular-users-list');
      browser.assert.elements('.popular-users-list li', 5);
    });

    it('search people');
  });
});
