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

//for populating the database
var dbData = require('../../dbData');
var dbPopulate = require('../../dbPopulate')(db);

// use zombie.js as headless browser
var Browser = require('zombie');

describe('user visits /discussion/:id/:topic', function () {

let loggedUser = dbData.users[0];

//********setting server, browser
  before(function () {
    this.server = app(session).listen(3000);
    this.browser = new Browser({ site: 'http://localhost:3000' });
  });

  after(function (done) {
    this.server.close(done);
  });
//*******END

//******populating database
  before(function (done) {
    return dbPopulate.clear()
      .then(done, done);
  });

  beforeEach(function (done) {
    dbData = require('../../dbData');
    return dbPopulate.populate(dbData)
      .then(done, done);
  });

  afterEach(function (done) {
    return dbPopulate.clear()
      .then(done, done);
  });
//**********END

  var existentDiscussion = dbData.discussions[0];

  var nonexistentDiscussion = {topic: 'nonexistent discussion', id: '1234567890'};
  existentDiscussion.url = generateUrl(existentDiscussion.topic);

  nonexistentDiscussion.url = generateUrl(nonexistentDiscussion.topic);
  var post0 = {text: 'text of a first post', creator: 'mrkvon'};
  var post1 = {text: 'text of a second post', creator: 'test1'};

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

      context('user visits only /discussion/:id', function () {
        context('has rights to view the discussion', function () {
          it('should permanent redirect to the url with correct topic', function (done) {
            var browser = this.browser;
            browser.visit('/discussion/' + existentDiscussion.id)
              .then(function () {
                browser.assert.success();
                browser.assert.redirected();
                browser.assert.url(new RegExp('^.*/discussion/'+ existentDiscussion.id + '/' + existentDiscussion.url + '/?$'));
              })
              .then(done, done);
          });
        });
      });

      it('should show a discussion page', function (done) {
        var browser = this.browser;
        console.log('#######', existentDiscussion.comments,'*************', dbData.discussions[0].comments);
        browser.visit('/discussion/' + existentDiscussion.id + '/' + existentDiscussion.url)
          .then(function () {
            browser.assert.text('#discussion-topic', existentDiscussion.topic);
            for(let dca of existentDiscussion.comments) {
              console.log(dca);
              browser.assert.text('#discussion-post-' + dca.id + ' .text', dca.text);
              browser.assert.text('#discussion-post-' + dca.id + ' .author', dca.author);
            }
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
                .fill('username', loggedUser.username)
                .fill('password', loggedUser.password)
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
            let validPost = {
              text: 'this is an added post',
              author: loggedUser.username
            };
            it('should add a new post to the database and show it', function (done) {
              var browser = this.browser;
              return browser
                .fill('text', validPost.text)
                .pressButton('post')
                .then(function () {
                  browser.assert.success();
                  browser.assert.text('.text', new RegExp('.*' + validPost.text + '.*'));
                  browser.assert.text('.author', new RegExp('.*' + validPost.author + '.*'));
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

  context('the discussion doesn\'t exist', function () {
    it('should show a proper not found page.');
  });

});

