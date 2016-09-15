'use strict';

module.exports = function (collection) {
  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require('./dbCollection')(collection);

  let deps = config.init({db: dbConfig}, dbData);

  let funcs = config.funcs;

  var generateUrl = require('../../../routes/collection/functions').generateUrl;

  describe(`user visits /${collection}/:id/:name`, function () {
    let browserObj = {};
    let browser;

    config.beforeTest(browserObj, deps);

    beforeEach(function () { 
      browser = browserObj.Value;
    });

    let loggedUser = dbData.users[0];
    var existentCollection = dbData[`${collection}s`][0];
    existentCollection.url = generateUrl(existentCollection.name);

    var nonexistentCollection = {name: `nonexistent ${collection}`, id: '1234567890'};
    nonexistentCollection.url = generateUrl(nonexistentCollection.name);

    context(`the ${collection} exists`, function () {
      //*
      context('url has an incorrect name', function () {
        beforeEach(funcs.visit(() => `/${collection}/${existentCollection.id}/random-url`, browserObj));

        it('should permanent redirect to the url with correct name', function () {
          browser.assert.success();
          browser.assert.redirected();
          browser.assert.url(`/${collection}/${existentCollection.id}/${existentCollection.url}`);
        });
      });

      context('user visits /${collection}/:id (without .../:url)', function () {
        beforeEach(funcs.visit(() => `/${collection}/${existentCollection.id}`, browserObj));

        it('should permanent redirect to the url with correct name', function () {
          browser.assert.success();
          browser.assert.redirected();
          browser.assert.url(`/${collection}/${existentCollection.id}/${existentCollection.url}`);
        });
      });

      context('user visits correct url', function () {
        beforeEach(funcs.visit(() => `/${collection}/${existentCollection.id}/${existentCollection.url}`, browserObj));

        it(`should show a ${collection} page`, function () {
          browser.assert.success();
        });

        it(`should show a ${collection} name`, function () {
          browser.assert.text(`.${collection}-name`, existentCollection.name);
        });

        it(`should show a ${collection} description`, function () {
          browser.assert.element(`.${collection}-description`);
          browser.assert.text(`.${collection}-description`, existentCollection.description);
        });

        it('should show a share link', function () {
          browser.assert.input('.share-link input[readonly]', browser.url);
        });

        it(`should show ${collection} comments`, function () {
          for(let comment of existentCollection.comments) {
            browser.assert.text(`#${collection}-comment-${comment.id} .${collection}-comment-text`, comment.text);
            browser.assert.text(`#${collection}-comment-${comment.id} .${collection}-comment-author`, comment.author);
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
        beforeEach(funcs.visit(() => `/${collection}/${existentCollection.id}/${existentCollection.url}`, browserObj));
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

            beforeEach(funcs.fill(() => `/${collection}/${existentCollection.id}/${existentCollection.url}`, {comment: validComment.text, submit: '.comment-form [name=action][value=comment]'}, browserObj));

            it('should add a new comment to the database and show it', function () {
              browser.assert.success();
              browser.assert.text(`.${collection}-comment-text`, new RegExp(`.*` + validComment.text + `.*`));
              browser.assert.text(`.${collection}-comment-author`, new RegExp(`.*` + validComment.author + `.*`));
            });
          });

          context('invalid comment [empty]', function () {
            beforeEach(funcs.fill(() => `/${collection}/${existentCollection.id}/${existentCollection.url}`, {comment: '', submit: '.comment-form [name=action][value=comment]'}, browserObj));

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

            beforeEach(funcs.fill(() => `/${collection}/${existentCollection.id}/${existentCollection.url}`, {comment: longComment, submit: '.comment-form [name=action][value=comment]'}, browserObj));

            it('should complain about invalid data (too long)', function () {
              //too long means > 16384 characters
              browser.assert.text('.popup-message', 'the maximal length of text is 16384');
            });
          });
        });
      });

      context(`${collection} contains her own comment`, function () {
        it('should show edit link at the comment');
        it('should show delete link at the comment');
        it('shouldn\'t show edit nor delete lin at comments of different users');
      });

      context('doesn\'t have rights to add a comment', function () {
        beforeEach(funcs.logout(browserObj));
        beforeEach(funcs.visit(() => `/${collection}/${existentCollection.id}/${existentCollection.url}`, browserObj));

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

    context(`the ${collection} doesn't exist`, function () {
      it(`should show 404 Not Found`, funcs.testError(() => `/${collection}/12345678/nonexistent-${collection}`, 404, browserObj));
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
