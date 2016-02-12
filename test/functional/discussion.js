'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'test';
// get the application server module
var app = require('../../app');
var session = require('../../session');
// use zombie.js as headless browser
var Browser = require('zombie');

describe('user visits /discussions', function () {
  before(function () {
    this.server = app(session).listen(3000);
    this.browser = new Browser({ site: 'http://localhost:3000' });
  });

  context('when user is not logged in', function () {
    before(function logOut(done) {
      var browser = this.browser;
      browser
        .visit('/logout')
        .then(function visitDiscussions() {
          return browser.visit('/discussions');
        })
        .then(done, done);
    });

    it('should show the discussions page', function () {
      this.browser.assert.success();
      this.browser.assert.text('h1', 'Discussions');
    });

    it('should show the popular discussions list');
    it('should suggest to log in or sign up to see more', function () {
      var browser = this.browser;
      browser.assert.text('div#login-signup-msg', 'log in or sign up to see more');
      browser.assert.link('div#login-signup-msg a', 'log in', '/login');
      browser.assert.link('div#login-signup-msg a', 'sign up', '/signup');
    });
    
    it('should not show a start a new discussion link', function () {
      var browser = this.browser;
      browser.assert.elements('a#new-discussion', 0);
    });
  });

  context('when user is logged in', function () {
    before(function (done) {
      this.browser.visit('/login')
        .then(() => {
          return this.browser
            .fill('username', 'test1')
            .fill('password', 'asdfasdf')
            .pressButton('log in');
        })
        .then(done, done);
    });

    before(function (done) {
      this.browser.visit('/discussions')
        .then(done, done);
    });
    
    it('should show the discussions page', function () {
      this.browser.assert.success();
      this.browser.assert.text('h1', 'Discussions');
    });
    it('should show a list of discussions');
    it('should show a list of discussions with new posts which user follows');
    it('should show a list of discussions by user tags');
    it('should show a list of popular discussions');
    it('should show a \'start a new discussion\' button', function () {
      var browser = this.browser;
      browser.assert.success();
      browser.assert.element('a#new-discussion');
      browser.assert.attribute('a#new-discussion', 'href', '/discussions/new');
      browser.assert.text('a#new-discussion', 'start a new discussion');
    });

    context('when user visits the \'start a new discussion\' link', function () {
      before(function (done) {
        this.browser.clickLink('start a new discussion')
          .then(done, done);
      });

      it('should go to a page /discussions/new', function () {
        this.browser.assert.success();
        this.browser.assert.url('/discussions/new');
      });
    });

    after(function (done) {
      this.browser.visit('/logout')
        .then(done, done);
    });
  });


  describe('user visits /discussions/new', function () {

    var logout = function (done) {
      this.browser.visit('/logout')
        .then(done, done);
    };

    context('when user is logged in', function () {

      before(function (done) {
        let browser = this.browser;
        browser.visit('/login')
          .then(() => {
            return browser.fill('username', 'test1')
              .fill('password', 'asdfasdf')
              .pressButton('log in');
          })
          .then(done, done);
      });

      beforeEach(function (done) {
        let browser = this.browser;
        browser.visit('/discussions/new')
          .then(done, done);
      });

      it('should show a new discussion form', function () {
        let browser = this.browser;
        browser.assert.success();
        browser.assert.text('h1', 'Start a new discussion');
        browser.assert.text('form#new-discussion label', 'topictagspost');
        browser.assert.element('form#new-discussion input[type=submit]');
        browser.assert.attribute('form#new-discussion input[type=submit]', 'value', 'start the discussion');
        browser.assert.attribute('form#new-discussion', 'method', 'post');
      });

      context('when form with an empty topic field is submitted', function () {
        var post = 'some post text';
        var tags = 'hitch-hiking, test-tag-1';
        beforeEach(function (done) {
          let browser = this.browser;
          browser.visit('/discussions/new')
            .then(() => {
              return browser
                .fill('tags', tags)
                .fill('post', post)
                .pressButton('start the discussion')
            })
            .then(done, done);
        });

        it('should return a form with a proper error', function () {
          let browser = this.browser;
          browser.assert.success();
          browser.assert.text('h1', 'Start a new discussion');
          browser.assert.element('form#new-discussion');
          browser.assert.text('div.popup-message.info', /^.*you need to write a topic$/);
        });

        it('should keep other fields filled', function () {
          let browser = this.browser; 
          browser.assert.input('input[name=tags]', tags);
          browser.assert.input('textarea[name=post]', post);
          browser.assert.input('input[name=topic]', '');
        });
      });

      it('should refuse too long post');
      it('should refuse too long title');
      it('should refuse too many tags');
      it('should refuse non-existent tags');

      it('should refuse a submitted form without tags and keep other fields filled', function (done) {
        var topic = 'some topic';
        var post = 'some post text';
        let browser = this.browser;
          
        browser.visit('/discussions/new')
          .then(() => {
            return browser
              .fill('topic', topic)
              .fill('post', post)
              .pressButton('start the discussion')
          })
          .then(() => {
            browser.assert.success();
            browser.assert.text('h1', 'Start a new discussion');
            browser.assert.element('form#new-discussion');
            browser.assert.text('div.popup-message.info', /^.*you need to choose 1 or more tags$/);
            browser.assert.input('input[name=topic]', topic);
            browser.assert.input('input[name=tags]', '');
            browser.assert.input('textarea[name=post]', post);
          })
          .then(done, done);
      });

      it('should refuse a submitted form with badly formatted tags and keep other fields filled', function (done) {
        var topic = 'some topic';
        var post = 'some post text';
        var tags = 'test tag 1, tag2, hitch-hikin^^g';
        var browser = this.browser;
          
        browser.visit('/discussions/new')
          .then(() => {
            return browser
              .fill('topic', topic)
              .fill('tags', tags)
              .fill('post', post)
              .pressButton('start the discussion');
          })
          .then(() => {
            browser.assert.success();
            browser.assert.text('h1', 'Start a new discussion');
            browser.assert.element('form#new-discussion');
            browser.assert.text('div.popup-message.info', /^.*the tags .* are badly formatted$/);
            browser.assert.input('input[name=topic]', topic);
            browser.assert.input('input[name=tags]', 'test tag 1, tag2, hitch-hikin^^g');
            browser.assert.input('textarea[name=post]', post);
          })
          .then(done, done);
      });

      it('should refuse a submitted form with missing post and keep other fields filled', function (done) {
        var topic = 'some topic';
        var tags = 'hitch-hiking, test-tag-1';
        var post = '';
        let browser = this.browser;
          
        browser.visit('/discussions/new')
          .then(() => {
            return browser
              .fill('topic', topic)
              .fill('tags', tags)
              .pressButton('start the discussion');
          })
          .then(() => {
            browser.assert.success();
            browser.assert.text('h1', 'Start a new discussion');
            browser.assert.element('form#new-discussion');
            browser.assert.text('div.popup-message.info', /^.*you need to write a post.*$/);
            browser.assert.input('input[name=topic]', topic);
            browser.assert.input('input[name=tags]', tags);
            browser.assert.input('textarea[name=post]', post);
          })
          .then(done, done);
      });

      it('should accept a valid submitted form and redirect to the newly created discussion', function (done) {
        var topic = 'What is a purpose of test?';
        var tags = 'hitch-hiking, test-tag-1';
        var post = 'What do you think, people? Well, this is just a test.';
        let browser = this.browser;
          
        browser.visit('/discussions/new')
          .then(() => {
            return browser
              .fill('topic', topic)
              .fill('tags', tags)
              .fill('post', post)
              .pressButton('start the discussion');
          })
          .then(() => {
            browser.assert.success();
            browser.assert.redirected();
            browser.assert.url(/^\/discussion\/[0-9]*\/what-purpose-test\/?$/);
            browser.assert.text('h1', 'discussion');
            browser.assert.text('div.popup-message.info', /^.*the new discussion was successfully started.*$/);
          })
          .then(done, done);
      });

      after(logout);
    });

    context('when user is not logged in', function () {
      beforeEach(logout);

      beforeEach(function (done) {
        this.browser.visit('/discussions/new')
          .then(done, done);
      });

      it('GET: should show an error and link to login page', function () {
        var browser = this.browser;
        browser.assert.text('div.popup-message.info', 'you need to log in to start a new discussion');
        browser.assert.link('div.popup-message.info a', 'log in', '/login?return-page=%2Fdiscussions%2Fnew');
      });

      it('POST: should show an error and link to login page');//how to implement this test with zombie??
    });
  });

  after(function (done) {
    this.server.close(done);
  });

});

