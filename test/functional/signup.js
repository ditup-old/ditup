'use strict';

let config = require('./partial/config');
let dbConfig = require('../../services/db-config');
let dbData = require('../dbData');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('signup', function () {
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  let loggedUser = dbData.users[0];

  var newUser = {
    username: 'new-user',
    password: 'asdfasdf',
    email: 'michal.salajka@example.com'
  };

  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    afterEach(funcs.logout(browserObj));

    context('GET', function () {
      beforeEach(funcs.visit('/signup', browserObj));

      it('should show a signup form', function () {
        browser.assert.success();
        browser.assert.element('form#signup-form');
      });
    });

    context('POST', function () {
      context('valid data', function () {
        beforeEach(funcs.fill('/signup', {username: newUser.username, email: newUser.email, password: newUser.password, password2: newUser.password, submit: 'sign up'}, browserObj));

        it('should create the user, log in and show welcoming message', function () {
          browser.assert.success();
          browser.assert.text('.popup-message', `Welcome ${newUser.username}. Your new account was created and verification email was sent to ${newUser.email}. It should arrive soon. In the meantime why don't you fill up your profile?`);
        });
      });

      context('invalid data', function () {
        context('[username]', function () {
          it('should show the username error');
          it('should keep the username filled');
        });
        context('[email]', function () {
          it('should show the email error');
          it('should keep the email filled');
        });
        context('[password]', function () {
          it('should show the password error');
        });
        context('[password mismatch]', function () {
          it('should show the password mismatch error');
        });
      });

      context('duplicate data', function () {
        context('[username]', function () {
          it('should show the duplicate username error');
          it('should keep the username filled');
        });
        context('[email]', function () {
          it('should show the duplicate email error');
          it('should keep the email filled');
        });
      });
    });
  });

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));

    beforeEach(funcs.visit('/signup', browserObj));

    it('should say that user needs to log out first (with link in "log out")', function () {
      browser.assert.success();
      browser.assert.text('div.popup-message.info', 'you are logged in as ' + loggedUser.username + '. To sign up you need to log out first.');
      browser.assert.link('div.popup-message.info a', 'log out', '/logout');
    });
  });
});
