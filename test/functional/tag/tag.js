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

      it('should show amount of all the uses of the tag');
      it('should show amount of uses by users');
      it('should show amount of uses by challenges');
      it('should show amount of uses by ideas');
      it('should show amount of uses by projects');
      it('should show amount of uses by discussions');

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
          context('valid data', function () {
            it('should redirect to the tag page');
            it('should update the tag');
            it('should say the update was successful');
          });
          context('invalid data', function () {
            it('should show the edit page again');
            it('should show the new invalid data in the form');
            it('should tell the error');
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
});
