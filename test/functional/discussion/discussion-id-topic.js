'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'test';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');

var Database = require('arangojs');
var config = require('../../../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});
var dbDiscussion = require('../../../services/data/discussion')(db);
var generateUrl = require('../../../routes/discussion/functions').generateUrl;

// use zombie.js as headless browser
var Browser = require('zombie');

describe('user visits /discussion/:id/:topic', function () {
  before(function () {
    this.server = app(session).listen(3000);
    this.browser = new Browser({ site: 'http://localhost:3000' });
  });

  var existentDiscussion = {topic: 'new test discussion', id: undefined};
  var nonexistentDiscussion = {topic: 'nonexistent discussion', id: '1234567890'};
  existentDiscussion.url = generateUrl(existentDiscussion.topic);
  nonexistentDiscussion.url = generateUrl(nonexistentDiscussion.topic);
  var post0 = {text: 'text of a first post', creator: 'mrkvon'};
  var post1 = {text: 'text of a second post', creator: 'test1'};

  beforeEach(function (done) {

    return dbDiscussion.create({topic: existentDiscussion.topic, creator: 'test1'})
      .then(function (_id) {
        existentDiscussion.id = _id.id;
        return dbDiscussion.addPost(_id.id, {text: post0.text, creator: post0.creator});
      })
      .then(function () {
        return dbDiscussion.addPost(existentDiscussion.id, {text: post1.text, creator: post1.creator});
      })
      .then(function () {done ();}, done);
    //create the discussion
    //add some posts

  });

  afterEach(function (done) {
    //delete the new discussion from database
    dbDiscussion.delete(existentDiscussion.id)
    
      .then(function () {done();}, done);
  });

  context('the discussion exists', function () {
    context('user has rights to view discussion', function () {
      context('url has an incorrect topic', function () {
        it('should permanent redirect to the url with correct topic', function (done) {
          var browser = this.browser;
          browser.visit('/discussion/' + existentDiscussion.id + '/' + 'random-url')
            .then(function () {
              browser.assert.success();
              browser.assert.redirected();
              browser.assert.url(new RegExp('^.*/discussion/'+ existentDiscussion.id + '/' + existentDiscussion.url + '/?$'));
            })
            .then(done, done);
        });
      });

      it('should show a discussion page', function (done) {
        var browser = this.browser;
        browser.visit('/discussion/' + existentDiscussion.id + '/' + existentDiscussion.url)
          .then(function () {
            browser.assert.text('#discussion-topic', existentDiscussion.topic);
            browser.assert.text('#discussion-post-0 .text', post0.text);
            browser.assert.text('#discussion-post-0 .creator', post0.creator);
            browser.assert.text('#discussion-post-1 .text', post1.text);
            browser.assert.text('#discussion-post-1 .creator', post1.creator);
          })
          .then(done, done);
      });

      context('has rights to add post', function () {
        
        //beforeEach: log in as test1
        beforeEach(function (done) {
          var browser = this.browser;
          return browser.visit('/login')
            .then(function () {
              //console.log('**************');
              return browser
                .fill('username', 'test1')
                .fill('password', 'asdfasdf')
                .pressButton('log in');
            })
            .then(done, done);
        });
        
        //afterEach: log out
        afterEach(function (done) {
          this.browser.visit('/logout').then(done, done);
        });

        it('should show a form to add post', function (done) {
          var browser = this.browser;
          browser.visit('/discussion/' + existentDiscussion.id + '/' + existentDiscussion.url)
            .then(function () {
              browser.assert.text('#new-post-form textarea', '');
              browser.assert.attribute('#new-post-form textarea', 'name', 'text');
              browser.assert.attribute('#new-post-form', 'method', 'post');
              browser.assert.attribute('#new-post-form input[type=submit]', 'value', 'post');
            })
            .then(done, done);
        });

        context('POST a new post', function () {
          beforeEach(function (done) {
            this.browser
              .visit('/discussion/' + existentDiscussion.id + '/'+existentDiscussion.url)
              .then(done, done);
          });
          context('valid post', function () {
            it('should add a new post to the database and show it', function (done) {
              var browser = this.browser;
              return browser
                .fill('text', 'added post')
                .pressButton('post')
                .then(function () {
                  browser.assert.success();
                  browser.assert.text('#discussion-post-2 .text', 'added post');
                  browser.assert.text('#discussion-post-2 .creator', 'test1');
                })
                .then(done, done);
            });
          });

          context('invalid post', function () {
            it('should complain about invalid data (empty)', function (done) {
              var browser = this.browser;
              return browser
                .fill('text', '')
                .pressButton('post')
                .then(function () {
                  browser.assert.text('#new-post .error', 'error: the message is empty');
                })
                .then(done, done);
            });

            it('should complain about invalid data (too long)', function (done) {
              //too long means 16384 characters
              //generate very long message
              var longMessage = '12345678';
              for (var i = 0; i < 13; ++i) {
                longMessage += longMessage;
              }
              var browser = this.browser;
              return browser
                .fill('text', longMessage)
                .pressButton('post')
                .then(function () {
                  browser.assert.text('#new-post .error', 'error: the message is too long');
                })
                .then(done, done);
            });
          });
        });

        context('has admin rights', function () {});
        context('doesn\'t have admin rights', function () {});
      });

      context('discussion contains her own post', function () {
        it('should show edit link at the post');
        it('should show delete link at the post');
        it('shouldn\'t show edit nor delete lin at posts of different users');
      });

      context('doesn\'t have rights to add post', function () {
        beforeEach(function (done) {
          this.browser.visit('/logout').then(done, done);
        });

        it('should say that posting is not possible, suggest login (with redirect back to this page)', function (done) {
          var browser = this.browser;
          var url = '/discussion/' + existentDiscussion.id + '/' + existentDiscussion.url;
          browser.visit(url)
            .then(function () {
              browser.assert.elements('#new-post-form textarea', 0);

              browser.assert.elements('#new-post-form input[type=submit]', 0);
              browser.assert.text('#new-post', 'You can\'t post in this discussion. Try to log in.');
              browser.assert.link('a', 'log in', '/login?redirect='+encodeURIComponent(url));
            })
            .then(done, done);
        });

        context('POST', function () {
          it('should complain about rights to log in and suggest logging in', function (done) {
            var browser = this.browser;
            var url = '/discussion/' + existentDiscussion.id + '/' + existentDiscussion.url;
            return browser.visit(url)
              .then(function () {
                return browser
                  //.fill('text', 'added post')
                  //.pressButton('post');
              })
              .then(function () {
                browser.assert.elements('#new-post-form textarea', 0);
                browser.assert.elements('#new-post-form input[type=submit]', 0);
                browser.assert.text('#new-post', 'You can\'t post in this discussion. Try to log in.');
                browser.assert.link('a', 'log in', '/login?redirect='+encodeURIComponent(url));
              })
              .then(done, done);
          });
        });
      });
    });

    context('user doesn\'t have rights to view the discussion', function () {
      it('should show an error message and login (if login required)');
    });
  });

  context('the discussion doesn\'t exist', function () {});

  after(function (done) {
    this.server.close(done);
  });
});

