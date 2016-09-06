'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('../../dbData');

let deps = config.init({db: dbConfig}, dbData);

let funcs = config.funcs;

var generateUrl = require('../../../routes/collection/functions').generateUrl;

describe('user visits /discussion/:id/:name', function () {
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  let loggedUser = dbData.users[0];
  var existentDiscussion = dbData.discussions[0];
  existentDiscussion.url = generateUrl(existentDiscussion.name);

  var nonexistentDiscussion = {name: 'nonexistent discussion', id: '1234567890'};
  nonexistentDiscussion.url = generateUrl(nonexistentDiscussion.name);

  context('the discussion exists', function () {
    //*
    context('url has an incorrect name', function () {
      beforeEach(funcs.visit(() => `/discussion/${existentDiscussion.id}/random-url`, browserObj));

      it('should permanent redirect to the url with correct name', function () {
        browser.assert.success();
        browser.assert.redirected();
        browser.assert.url(`/discussion/${existentDiscussion.id}/${existentDiscussion.url}`);
      });
    });

    context('user visits /discussion/:id (without .../:url)', function () {
      beforeEach(funcs.visit(() => `/discussion/${existentDiscussion.id}`, browserObj));

      it('should permanent redirect to the url with correct name', function () {
        browser.assert.success();
        browser.assert.redirected();
        browser.assert.url(`/discussion/${existentDiscussion.id}/${existentDiscussion.url}`);
      });
    });

    context('user visits correct url', function () {
      beforeEach(funcs.visit(() => `/discussion/${existentDiscussion.id}/${existentDiscussion.url}`, browserObj));

      it('should show a discussion page', function () {
        browser.assert.success();
      });

      it('should show a discussion name', function () {
        browser.assert.text('.discussion-name', existentDiscussion.name);
      });

      it('should show discussion comments', function () {
        for(let comment of existentDiscussion.comments) {
          browser.assert.text(`#discussion-comment-${comment.id} .discussion-comment-text`, comment.text);
          browser.assert.text(`#discussion-comment-${comment.id} .discussion-comment-author`, comment.author);
        }
      });

      it('should show number of followers', function () {
        browser.assert.element('.follow-count-followers');
        browser.assert.text('.follow-count-followers', '0');
      });
    });

    // */

    /*
    context('has rights to add comments', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      beforeEach(funcs.visit(() => `/discussion/${existentDiscussion.id}/${existentDiscussion.url}`, browserObj));
      afterEach(funcs.logout(browserObj));

      it('should show a form to add a comment', function () {
        browser.assert.element('.comment-form[method=post]');
        browser.assert.input('.comment-form textarea', '');
        browser.assert.element('.comment-form textarea[name=comment]');
        browser.assert.input('.comment-form input[type=submit]', 'comment');
        browser.assert.input('.comment-form [name=action]', 'comment');
      });

      context('POST a new comment', function () {
        context('valid comment', function () {
          let validComment = {
            text: 'this is an added comment',
            author: loggedUser.username
          };

          beforeEach(funcs.fill(() => `/discussion/${existentDiscussion.id}/${existentDiscussion.url}`, {comment: validComment.text, submit: '.comment-form [name=action][value=comment]'}, browserObj));

          it('should add a new comment to the database and show it', function () {
            browser.assert.success();
            browser.assert.text('.discussion-comment-text', new RegExp('.*' + validComment.text + '.*'));
            browser.assert.text('.discussion-comment-author', new RegExp('.*' + validComment.author + '.*'));
          });
        });

        context('invalid comment [empty]', function () {
          beforeEach(funcs.fill(() => `/discussion/${existentDiscussion.id}/${existentDiscussion.url}`, {comment: '', submit: '.comment-form [name=action][value=comment]'}, browserObj));

          it('should complain about invalid data (empty)', function () {
            browser.assert.text('.popup-message', 'the minimal length of text is 1');
          });
        });

        context('invalid comment [too long]', function () {
          //generate a very long comment
          var longComment = '12345678';
          for (let i = 0; i < 13; ++i) {
            longComment += longComment;
          }

          beforeEach(funcs.fill(() => `/discussion/${existentDiscussion.id}/${existentDiscussion.url}`, {comment: longComment, submit: '.comment-form [name=action][value=comment]'}, browserObj));

          it('should complain about invalid data (too long)', function () {
            //too long means > 16384 characters
            browser.assert.text('.popup-message', 'the maximal length of text is 16384');
          });
        });
      });
    });

    context('discussion contains her own post', function () {
      it('should show edit link at the post');
      it('should show delete link at the post');
      it('shouldn\'t show edit nor delete lin at posts of different users');
    });

    context('doesn\'t have rights to add a comment', function () {
      beforeEach(funcs.logout(browserObj));
      beforeEach(funcs.visit(() => `/discussion/${existentDiscussion.id}/${existentDiscussion.url}`, browserObj));

      it('should suggest to log in', function () {
        browser.assert.text('.popup-message', 'log in to see more and contribute');
      });

      it('should not show the comment form', function () {
        browser.assert.elements('.comment-form textarea', 0);
        browser.assert.elements('.comment-form input[type=submit]', 0);
      });

      context('POST', function () {
        it('should show 403 Error (untestable)');
      });
    });
    // */
  });

  context('the discussion doesn\'t exist', function () {
    it('should show 404 Not Found', funcs.testError(() => `/discussion/12345678/nonexistent-discussion`, 404, browserObj));
  });

});

