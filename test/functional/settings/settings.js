'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbSettings');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('user settings', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let unverifiedUser = dbData.users[1];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));
    beforeEach(funcs.visit(`/settings`, browserObj));
    
    /*
    it('should be successful', function () {
      browser.assert.success();
      browser.assert.url(`/settings`);
    });

    it('should show User settings section', function () {
      browser.assert.element('.settings-user');
      browser.assert.text('.settings-user header', 'User');
    });

    it('should show Email section', function () {
      browser.assert.element('.settings-email');
      browser.assert.text('.settings-email header', 'Email');
      browser.assert.text('.settings-email .settings-current-email', loggedUser.email);
    });

    it('should show Password section', function () {
      browser.assert.element('.settings-password');
      browser.assert.text('.settings-password header', 'Password');
    });

    it('should show danger section', function () {
      browser.assert.element('.settings-danger');
      browser.assert.text('.settings-danger header', 'Danger');
    });
    // */
    
    /*
    context('email section', function () {
      it('should show \'new email\' form [with the email, password, action inputs]', function () {
        browser.assert.element('.settings-new-email');
        browser.assert.element('.settings-new-email input[name=new-email]');
        browser.assert.element('.settings-new-email input[type=password][name=password]');
        browser.assert.input('.settings-new-email [name=action]', 'change email');
      });

      context('POST a new email', function () {
        let newEmail = 'new.email@example.com';
        let invalidEmail = 'new.email(at)example.com';

        context('good data', function () {

          beforeEach(funcs.fill('/settings', {'.settings-new-email [name="new-email"]': newEmail, '.settings-new-email [name=password]': loggedUser.password, submit: '.settings-new-email [name=action][value="change email"]'}, browserObj));

          it('should save the new email in database and show it on settings page', function () {
            browser.assert.text('.settings-current-email', newEmail);
          });

          it('should show that the new email is not verified', function () {
            browser.assert.text('.settings-email-verified', 'not verified');
          });

          it('should say that the email was saved and verification email sent', function () {
            browser.assert.text('.popup-message', `The email was changed. A verification code was sent to your email (${newEmail}). Check also your spam folder.`);
          });
        });

        context('bad data [invalid email]', function () {

          beforeEach(funcs.fill('/settings', {'.settings-new-email [name="new-email"]': invalidEmail, '.settings-new-email [name=password]': loggedUser.password, submit: '[value="change email"]'}, browserObj));

          it('should complain about invalid email', function () {
            browser.assert.text('.popup-message', 'the email is invalid');
          });

          it('should keep the invalid email filled', function () {
            browser.assert.input('[name="new-email"]', invalidEmail);
          });

          it('should keep the password filled', function () {
            browser.assert.input('[name="password"]', loggedUser.password);
          });
        });

        context('bad data [duplicit email]', function () {
          beforeEach(funcs.fill('/settings', {'[name="new-email"]': unverifiedUser.email, '.settings-new-email [name=password]': loggedUser.password, submit: '[value="change email"]'}, browserObj));

          it('should complain about duplicit email', function () {
            browser.assert.text('.popup-message', 'the email is duplicit');
          });
          it('should keep the password filled', function () {
            browser.assert.input('[name="password"]', loggedUser.password);
          });
          it('should keep the email filled', function () {
            browser.assert.input('[name="new-email"]', unverifiedUser.email);
          });
        });

        context('bad data [wrong password]', function () {
          beforeEach(funcs.fill('/settings', {'[name="new-email"]': newEmail, '.settings-new-email [name=password]': 'wrong-password', submit: '[value="change email"]'}, browserObj));

          it('should complain about wrong password', function () {
            browser.assert.text('.popup-message', 'the password is wrong');
          });

          it('should keep the email filled', function () {
            browser.assert.input('[name="new-email"]', newEmail);
          });
          it('should empty the password', function () {
            browser.assert.input('[name="password"]', '');
          });
        });
      });
      
      context('email verified', function () {
        it(`should show 'verified' next to email`, function () {
          browser.assert.text('.settings-email-verified', 'verified');
        });
      });
      //
      context('email unverified', function () {
        //logout
        beforeEach(funcs.logout(browserObj));
        //login as non-verified user
        beforeEach(funcs.login(unverifiedUser, browserObj));
        //visit settings
        beforeEach(funcs.visit('/settings', browserObj));
        //logout after
        afterEach(funcs.logout(browserObj));
        
        it(`should show 'not verified' next to email`, function () {
          browser.assert.text('.settings-email-verified', 'not verified');
        });

        it(`should show 'send verification code' button`, function () {
          browser.assert.element('.settings-send-verification-code');
          browser.assert.input('.settings-send-verification-code [name=action]', 'send verification code');
        });

        context('POST send verification code', function () {
          beforeEach(funcs.fill('/settings', {submit: '.settings-send-verification-code [name=action][value="send verification code"]'}, browserObj));
          it('should generate, save and send a new verification code, and say it', function () {
            browser.assert.text('.popup-message', `A new verification code was sent to your email (${unverifiedUser.email}). Follow the link provided. Check also your spam folder.`);
          });
        });
      });
    });
    // */

    //*
    context('password section', function () {
      it('should show a form for typing a new password', function () {
        browser.assert.element('.settings-new-password');
        browser.assert.element('.settings-new-password input[type=password][name=current-password]');
        browser.assert.element('.settings-new-password input[type=password][name=new-password]');
        browser.assert.element('.settings-new-password input[type=password][name=new-password2]');
        browser.assert.input('.settings-new-password [name=action]', 'change password');
      });

      context('POST new password', function () {
        let newPassword = 'thisiss0m4goodpassword';
        let invalidPassword = '5543';
        context('good data', function () {
          beforeEach(funcs.fill('/settings', {'[name=current-password]': loggedUser.password, '[name=new-password]': newPassword, '[name=new-password2]': newPassword, submit: 'change password'}, browserObj));

          it('should save the new password to database and say it', function () {
            browser.assert.text('.popup-message', 'the password was changed');
          });
        });
        
        context('bad data [wrong old password]', function () {
          it('should complain about wrong password');
          it('should keep the new passwords filled');
          it('should empty the old password');
        });
        context('bad data [invalid new password]', function () {
          it('should complain about invalid password');
          it('should keep the old password filled');
        });
        context('bad data [new passwords mismatch]', function () {
          it('should complain about mismatching passwords');
          it('should keep the mismatching passwords in the form');
          it('should keep the old password in the form');
        });
      });
    });
    // */

    /*
    context('danger section', function () {
      it('should show Delete account button', function () {
        browser.assert.element('.settings-delete-account');
        browser.assert.input('.settings-delete-account [name=action]', 'delete account');
      });

      context('POST delete account', function () {
        it('should show disclaimer... this cannot be undone. (and about keeping public data), do you want to continue? yes, no');

        context('click YES', function () {
          it('should log the user out, delete her, say goodbye and ask for feedback');
        });

        context('click NO', function () {
          it('go to /settings page');
        });
      });
    });
    // */
  });
  
  /*
  context('not logged in', function () {
    it('should show 403 - Not Authorized error', funcs.testError(`/settings`, 403, browserObj));
  });
  // */
});