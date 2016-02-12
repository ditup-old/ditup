'use strict';
// force the test environment to 'test'
process.env.NODE_ENV = 'test';
// get the application server module
var app = require('../../app');
var session = require('../../session');
// use zombie.js as headless browser
var Browser = require('zombie');

describe('login page', function () {
  var server, browser;
  before(function () {
    server = this.server = app(session).listen(3000);
    browser = this.browser = new Browser({ site: 'http://localhost:3000' });
  });

  beforeEach(function (done) {
    this.browser.visit('/login', done);
  });

  context('user is logged in', function () {
    before(function (done) {
      this.browser
        .visit('/login')
        .then(done, done);
    });
    
    before(function (done) {
      this.browser
        .fill('username','test1')
        .fill('password', 'asdfasdf')
        .pressButton('log in')
        .then(done, done)
    });

    before(function (done) {
      this.browser
        .visit('/login')
        .then(done, done);
    });

    it('should print an error - user has to log out first', function () {
      this.browser.assert.success();
      this.browser.assert.text('div.popup-message', 'you are logged in as test1. To log in you need to log out first.');
    });
    after(function (done) {
      this.browser.visit('/logout')
        .then(done, done);
    });
  });

  context('user is not logged in', function () {
    beforeEach(function (done) {
      this.browser
        .visit('/logout')
        .then(done, done);
    });

    beforeEach(function (done) {
      this.browser
        .visit('/login')
        .then(done, done);
    });


    it('should show a login form', function () {
      this.browser.assert.success();
      this.browser.assert.text('#login-form label', 'usernamepassword');
    });

    it('should refuse nonexistent username', function (done) {
      var browser = this.browser;
      browser
        .fill('username', 'nonexistent-username')
        .pressButton('log in')
        .then(function () {
          browser.assert.success();
          browser.assert.text('#login-form label', 'usernamepassword');
          browser.assert.text('div.popup-message', 'login not successful');
        })
        .then(done, done);
    });
    it('should refuse existent username with wrong password', function (done) {
      var browser = this.browser;
      browser
        .fill('username', 'test1')
        .fill('password', 'asdfasdg')
        .pressButton('log in')
        .then(function () {
          browser.assert.success();
          browser.assert.text('#login-form label', 'usernamepassword');
          browser.assert.text('div.popup-message', 'login not successful');
        })
        .then(done, done);
    });
    it('should accept the right username and password combination', function (done){
      var browser = this.browser;
      browser
        .fill('username', 'test1')
        .fill('password', 'asdfasdf')
        .pressButton('log in')
        .then(function () {
          browser.assert.success();
          browser.assert.text('div.popup-message', 'login successful. you\'re logged in as Bub Ble');
        })
        .then(done, done);
    });
  });

  after(function (done) {
    this.server.close(done);
  });
});
