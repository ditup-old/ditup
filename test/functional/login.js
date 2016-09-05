'use strict';

let config = require('./partial/config');

let dbConfig = require('../../services/db-config');

let dbData = require('../dbData');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('login page', function () {
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  let loggedUser = dbData.users[0];
  let existentUser = dbData.users[1];

  context('user is logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));
    
    beforeEach(funcs.visit(`/login`, browserObj));

    it('should print an error - user has to log out first', function () {
      browser.assert.success();
      browser.assert.text('div.popup-message', `you are logged in as ${loggedUser.username}. To log in as a different user you need to log out first.`);
    });
  });

  context('user is not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    beforeEach(funcs.visit('/login', browserObj));

    it('should show a login form', function () {
      browser.assert.success();
      browser.assert.text('#login-form label', 'usernamepassword');
    });

    context('POST', function () {
      context('nonexistent username', function () {
        beforeEach(funcs.login({username: 'nonexistent-username', password: 'asdfasdf'}, browserObj));
        afterEach(funcs.logout(browserObj));

        it('should show login form and say login not successful', function () {
          browser.assert.success();
          browser.assert.text('#login-form label', 'usernamepassword');
          browser.assert.text('div.popup-message', 'login not successful');
        });
      });

      context('wrong password', function () {
        beforeEach(funcs.login({username: existentUser.username, password: 'bad-password &&'}, browserObj));
        afterEach(funcs.logout(browserObj));

        it('should show login form and say login not successful', function () {
          browser.assert.success();
          browser.assert.text('#login-form label', 'usernamepassword');
          browser.assert.text('div.popup-message', 'login not successful');
        });
      });

      context('good data', function () {
        beforeEach(funcs.login(existentUser, browserObj));
        afterEach(funcs.logout(browserObj));
        it('should say login successful', function (){
          browser.assert.success();
          browser.assert.text('div.popup-message', `login successful. you're logged in as ${existentUser.username}`);
        });

        it('should redirect', function () {
          browser.assert.redirected();
        });
      });
    });
  });
});
