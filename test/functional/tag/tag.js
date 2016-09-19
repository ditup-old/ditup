'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbTag');
let co = require('co');
let marked = require('marked');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('tag pages', function () {
  // ********** preparation
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });
  // ***********end of preparation
  //
  //
  let loggedUser = dbData.users[0];
  let existentTag = dbData.tags[0];
  let nonExistentTag = {
    tagname: 'nonexistent-tag',
    description: 'nonexistent description'
  }
  let validDescription = 'this is a valid description';
  let invalidDescription = 'aaaaaaaa';
  for(let i=0; i<12; ++i) {
    invalidDescription += invalidDescription;
  }

  describe('/tag/:tagname', function () {
    context(':tagname exists', function () {
      beforeEach(funcs.visit(`/tag/${existentTag.tagname}`, browserObj));
      it('should show the tag name', function () {
        browser.assert.text('.tag-tagname', existentTag.tagname);
      });
      it('should show the tag description', function () {
        browser.assert.text('.tag-description', existentTag.description);
      });

      it('should show amount of all the uses of the tag', function () {
        browser.assert.text('.tag-all-count', dbData.users.length + dbData.challenges.length + dbData.ideas.length + dbData.projects.length + dbData.discussions.length);
      });
      it('should show amount of uses by users', function () {
        browser.assert.text('.tag-user-count', dbData.users.length);
      });
      it('should show amount of uses by challenges', function () {
        browser.assert.text('.tag-challenge-count', dbData.challenges.length);
      });
      it('should show amount of uses by ideas', function () {
        browser.assert.text('.tag-idea-count', dbData.ideas.length);
      });
      it('should show amount of uses by projects', function () {
        browser.assert.text('.tag-project-count', dbData.projects.length);
      });
      it('should show amount of uses by discussions', function () {
        browser.assert.text('.tag-discussion-count', dbData.discussions.length);
      });

      let pages = ['all-uses', 'users', 'challenges', 'ideas', 'discussions', 'projects'];

      for(let page of pages) {
        it(`should link to the /tag/:tagname/${page} page`, function () {
          browser.assert.attribute(`.tag-${page}-link`, 'href', `/tag/${existentTag.tagname}/${page}`);
        });
      }

      context('logged in', function () {
        beforeEach(funcs.login(loggedUser, browserObj));
        beforeEach(funcs.visit(`/tag/${existentTag.tagname}`, browserObj));
        afterEach(funcs.logout(browserObj));
        it('should show edit tag link', function () {
          browser.assert.link('.edit-tag-link', 'edit', `/tag/${existentTag.tagname}/edit`)
        });
      });
    });

    context(':tagname doesn\'t exist', function () {
      it('should show 404 page', funcs.testError(`/tag/${nonExistentTag.tagname}`, 404, browserObj));
    });
  });
  
  describe('/tag/:tagname/edit', function () {
    context('logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));

      context('GET', function () {
        context('the :tagname exists', function () {
          beforeEach(funcs.visit(`/tag/${existentTag.tagname}/edit`, browserObj));

          it('show edit form with editable description filled with current tag data', function () {
            browser.assert.element('.edit-tag-form');
            browser.assert.input('.edit-tag-form textarea[name=description]', existentTag.description);
            browser.assert.input('.edit-tag-form input[type=submit][name=action]', 'save');
          });

          it('show cancel button, linking back to tag page', function () {
            browser.assert.link('a', 'cancel', `/tag/${existentTag.tagname}`);
          });
        });

        context('the tagname doesn\'t exist', function () {
          it('should show 404 error', funcs.testError(`/tag/${nonExistentTag.tagname}/edit`, 404, browserObj));
        });
      });

      context('POST', function () {
        context('the tagname exists', function () {
          beforeEach(funcs.fill(`/tag/${existentTag.tagname}/edit`, {'.edit-tag-form [name=description]': validDescription ,submit: '.edit-tag-form [value=save]'}, browserObj));
          context('valid data', function () {
            it('should redirect to the tag page', function () {
              browser.assert.redirected();
              browser.assert.url(`/tag/${existentTag.tagname}`);
            });
            it('should update the tag', function () {
              browser.assert.text('.tag-description', validDescription);
            });
            it('should say the update was successful', function () {
              browser.assert.text('.popup-message', `the tag ${existentTag.tagname} was successfully updated`);
            });
          });
          context('invalid data', function () {
            beforeEach(funcs.fill(`/tag/${existentTag.tagname}/edit`, {'.edit-tag-form [name=description]': invalidDescription ,submit: '.edit-tag-form [value=save]'}, browserObj));
            it('should show the edit page again', function () {
              browser.assert.url(`/tag/${existentTag.tagname}/edit`);
            });
            it('should show the new invalid data in the form', function () {
              browser.assert.text('.edit-tag-form textarea[name=description]', invalidDescription);
            });
            it('should tell the error', function () {
              browser.assert.element('.popup-message');
            });
          });
        });

        context('the tagname doesn\'t exist', function () {
          it('should show 404 error');
        });
      });
    });

    context('not logged in', function () {
      beforeEach(funcs.logout(browserObj));
      it('should show 403 Not Authorized error', funcs.testError(`/tag/${nonExistentTag.tagname}/edit`, 403, browserObj));
    });
  });

  it('TODO pages /tag/:tagname/projects etc.');
  it('TODO maybe show popular dits with this tag');
});
