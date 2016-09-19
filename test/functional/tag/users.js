'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbUsers');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;


describe('/tag/:tagname/users', function () {
  // ********** preparation
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });
  // ***********end of preparation
  //
  //
  let loggedUser = dbData.users[0];
  let existentTag = dbData.tags[0];

  beforeEach(funcs.visit(`/tag/${existentTag.tagname}/users`, browserObj));

  it('should show the tag-users page', function () {
    //browser.assert.text('.tag-users-header', 'Users');
    browser.assert.element('.tag-users');
  });
  it('should list the users', function () {
    browser.assert.elements('.tag-user', Math.ceil(dbData.users.length / 2));
  });
  it('should show other tags of each user', function () {
    browser.assert.elements('.tag-user-tags-list', Math.ceil(dbData.users.length/2));
  });
});
