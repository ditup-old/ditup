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

    it('should highlight unseen messages', function () {
      browser.assert.elements('.message.msg-not-viewed', 2);
      //TODO test that when viewed, they'll be not highlighted
    });

    it('when viewed should make unseen messages seen', function (done) {
      //this is already a second visit
      return co(function *() {
        yield browser.visit('/messages/'+ otherUser.username);
        browser.assert.elements('.message.msg-not-viewed', 0);
        done();
      })
      .catch(function (err) {
        done(err);
      })
    });

    context(':username === logged username', function () {
      beforeEach(funcs.visit('/messages/'+loggedUser.username, browserObj));
      it('should redirect to /messages', function () {
        browser.assert.redirected();
        browser.assert.url('/messages');
      });
    });

    context('POST', function () {
      context('empty message', function () {
        beforeEach(funcs.fill('/messages/'+otherUser.username, {submit: 'send'}, browserObj));
        it('should not submit & complain', function () {
          browser.assert.text('.popup-message', 'the message cannot be empty');
        });
      });
      
      context('too long message', function () {
        let longMessage = '................';
        for(let i=0; i<11; ++i) {
          longMessage += longMessage;
        }

        beforeEach(funcs.fill('/messages/'+otherUser.username, {message: longMessage, submit: 'send'}, browserObj));
        it('should not submit & complain', function () {
          browser.assert.text('.popup-message', 'the message is too long');
        });
      });

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
      context('receiver === logged user', function () {
        it('should return error 400 - bad data'/*, TODO function (done) {
          return co(function *() {
            browser.fill('/messages/'+loggedUser.username);
            browser.assert.status(400);
            done();
          })
            .catch(function (err) {
              done(err);
            });
        }*/);
      });
      context('receiver does not exist', function () {
        it('should say that receiver was not found');
      });
    });
  });
});
