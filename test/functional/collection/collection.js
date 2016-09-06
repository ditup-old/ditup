'use strict';

module.exports = function (collectionName) {
  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require('../../dbData');

  let deps = config.init({db: dbConfig}, dbData);

  let funcs = config.funcs;

  var generateUrl = require('../../../routes/collection/functions').generateUrl;

  describe(`user visits /${collectionName}/:id/:name`, function () {
    let browserObj = {};
    let browser;

    config.beforeTest(browserObj, deps);

    beforeEach(function () { 
      browser = browserObj.Value;
    });

    let loggedUser = dbData.users[0];
    var existentCollection = dbData[`${collectionName}s`][0];
    existentCollection.url = generateUrl(existentCollection.name);

    var nonexistentCollection = {name: `nonexistent ${collectionName}`, id: '1234567890'};
    nonexistentCollection.url = generateUrl(nonexistentCollection.name);

    context(`the ${collectionName} exists`, function () {
      //*
      context('url has an incorrect name', function () {
        beforeEach(funcs.visit(() => `/${collectionName}/${existentCollection.id}/random-url`, browserObj));

        it('should permanent redirect to the url with correct name', function () {
          browser.assert.success();
          browser.assert.redirected();
          browser.assert.url(`/${collectionName}/${existentCollection.id}/${existentCollection.url}`);
        });
      });

      context('user visits /${collectionName}/:id (without .../:url)', function () {
        beforeEach(funcs.visit(() => `/${collectionName}/${existentCollection.id}`, browserObj));

        it('should permanent redirect to the url with correct name', function () {
          browser.assert.success();
          browser.assert.redirected();
          browser.assert.url(`/${collectionName}/${existentCollection.id}/${existentCollection.url}`);
        });
      });

      context('user visits correct url', function () {
        beforeEach(funcs.visit(() => `/${collectionName}/${existentCollection.id}/${existentCollection.url}`, browserObj));

        it(`should show a ${collectionName} page`, function () {
          browser.assert.success();
        });

        it(`should show a ${collectionName} name`, function () {
          browser.assert.text(`.${collectionName}-name`, existentCollection.name);
        });

        it(`should show ${collectionName} comments`, function () {
          for(let comment of existentCollection.comments) {
            browser.assert.text(`#${collectionName}-comment-${comment.id} .${collectionName}-comment-text`, comment.text);
            browser.assert.text(`#${collectionName}-comment-${comment.id} .${collectionName}-comment-author`, comment.author);
          }
        });

        it('should show number of followers', function () {
          browser.assert.element('.follow-count-followers');
          browser.assert.text('.follow-count-followers', '0');
        });
      });

      // */

      //*
      context('has rights to add comments', function () {
        beforeEach(funcs.login(loggedUser, browserObj));
        beforeEach(funcs.visit(() => `/${collectionName}/${existentCollection.id}/${existentCollection.url}`, browserObj));
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

            beforeEach(funcs.fill(() => `/${collectionName}/${existentCollection.id}/${existentCollection.url}`, {comment: validComment.text, submit: '.comment-form [name=action][value=comment]'}, browserObj));

            it('should add a new comment to the database and show it', function () {
              browser.assert.success();
              browser.assert.text(`.${collectionName}-comment-text`, new RegExp(`.*` + validComment.text + `.*`));
              browser.assert.text(`.${collectionName}-comment-author`, new RegExp(`.*` + validComment.author + `.*`));
            });
          });

          context('invalid comment [empty]', function () {
            beforeEach(funcs.fill(() => `/${collectionName}/${existentCollection.id}/${existentCollection.url}`, {comment: '', submit: '.comment-form [name=action][value=comment]'}, browserObj));

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

            beforeEach(funcs.fill(() => `/${collectionName}/${existentCollection.id}/${existentCollection.url}`, {comment: longComment, submit: '.comment-form [name=action][value=comment]'}, browserObj));

            it('should complain about invalid data (too long)', function () {
              //too long means > 16384 characters
              browser.assert.text('.popup-message', 'the maximal length of text is 16384');
            });
          });
        });
      });

      context(`${collectionName} contains her own post`, function () {
        it('should show edit link at the post');
        it('should show delete link at the post');
        it('shouldn\'t show edit nor delete lin at posts of different users');
      });

      context('doesn\'t have rights to add a comment', function () {
        beforeEach(funcs.logout(browserObj));
        beforeEach(funcs.visit(() => `/${collectionName}/${existentCollection.id}/${existentCollection.url}`, browserObj));

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

    context(`the ${collectionName} doesn't exist`, function () {
      it(`should show 404 Not Found`, funcs.testError(() => `/${collectionName}/12345678/nonexistent-${collectionName}`, 404, browserObj));
    });

  });
};

/*
 *
 * these are some TODO tests which may be done later in collections
describe('visit /challenge/:id/:name', function () {
  context('challenge with :id exists', function () {
    context(':id and :name are valid', function () {
      it('should show activity log');
      it('should show stars')
      it('should show the challenges, tags, followers, stars, etc.');
      context('not logged in', function () {
        it('should suggest logging in or signing up with proper redirect in link', function () {
        });
      });

      context('logged in', function () {
        //challenge/id/name/add-tag

        it('should show buttons for launching idea, project, discussion, challenge...');
        it('may make it possible to link existent ideas, projects, discussions, challenges');
        it('may be possible to edit the challenge name and description in wikipedia or etherpad style');

        context('user is creator', function () {
          it('may be possible to delete the challenge if not embraced'); //challenge/id/name/delete //discourage!
          it('may be possible for the creator to remove their name (anonymization)');
        });
        
        context('user is not a creator', function () {});
      });
    });
});
// */
