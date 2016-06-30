'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbMessages');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('visit /messages/:username', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));

    it('should say this is available only to logged user. log in.', function (done) {
      return co(function *() {
        try {
          yield browser.visit('/messages/' + otherUser.username);
        } catch (err){}
        browser.assert.status(403);
        done();
      })
      .catch(function (err) {
        done(err);
      });
    });
  });

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    beforeEach(funcs.visit('/messages/' + otherUser.username, browserObj));
    afterEach(funcs.logout(browserObj));

    it('should show page title', function () {
      browser.assert.text('.page h1', 'Messages with ' + otherUser.username);
    });

    it('should show messages of logged user with user from url', function () {
      browser.assert.elements('.message', 5);
    });

    it('should show form with textarea for sending the message', function () {
      browser.assert.element('form textarea[name=message]');
      browser.assert.element('form input[type=submit][name=send][value=send]');
    });

    it('should highlight unseen messages');
    it('when viewed should make unseen messages seen');

    context(':username === logged username', function () {
      it('should complain and give error');
    });

    context('POST', function () {
      it('should not submit empty message');
      it('should not submit too long message');
      context('receiver exists', function () {
        context('message is good', function () {
          let message = 'this is a good message';
          beforeEach(funcs.fill('/messages/'+otherUser.username, {message: message, submit: 'send'}, browserObj));

          it('should submit a good message', function () {
            browser.assert.success();
          });

          it('should say that message was sent', function () {
            browser.assert.text('.popup-message.info', 'the message was sent successfully');
          });
        });

        it('should show the new message');
      });
      context('receiver does not exist', function () {
        it('should say that receiver was not found');
      });
    });
  });
});
