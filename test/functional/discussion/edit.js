'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbDataDiscussions');
let generateUrl = require('../../../routes/collection/functions').generateUrl;

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('edit discussion', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let otherUser = dbData.users[1];
  let creator = dbData.users[2];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  var existentDiscussion = dbData.discussions[0];
  
  context('logged in as creator', function () {
    beforeEach(funcs.login(creator, browserObj));
    afterEach(funcs.logout(browserObj));

    context('visit /discussion/id/name', function () {
      beforeEach(funcs.visit(()=>`/discussion/${existentDiscussion.id}/${existentDiscussion.url}`, browserObj));
      it('should show an edit button next to name', function () {
        browser.assert.element('.edit-discussion-name');
        browser.assert.link('a.edit-discussion-name', 'edit', `/discussion/${existentDiscussion.id}/${existentDiscussion.url}/edit?field=name`);
      });

      it('should show an edit button next to description', function () {
        browser.assert.element('.edit-discussion-description');
        browser.assert.link('a.edit-discussion-description', 'edit', `/discussion/${existentDiscussion.id}/${existentDiscussion.url}/edit?field=description`);
      });
    });

    context('visit /discussion/id/name/edit', function () {
      context('?field=name', function () {
        beforeEach(funcs.visit(()=>`/discussion/${existentDiscussion.id}/${existentDiscussion.url}/edit?field=name`, browserObj));

        it('should show form for editing discussion name', function () {
          browser.assert.element('form.edit-collection-name');
          browser.assert.input('form.edit-collection-name input[type=submit]', 'update name');
        });

        it('form filled with discussion name', function () {
          browser.assert.input('form.edit-collection-name input[type=text]', existentDiscussion.name);
        });

        context('POST', function () {
          let newName = 'this is a new name';
          let newUrl = generateUrl(newName);
          beforeEach(funcs.fill(()=>`/discussion/${existentDiscussion.id}/${existentDiscussion.url}/edit?field=name`, {name: newName, submit: 'update name'}, browserObj));

          it('should update the name and redirect to the page', function () {
            browser.assert.redirected();
            browser.assert.url(`/discussion/${existentDiscussion.id}/${newUrl}`);
            browser.assert.text('.collection-name', newName);
          });

          it('should say that the name was updated', function () {
            browser.assert.text('.popup-message', 'the name was updated');
          });
        });
      });
    });
  });

  context('logged in as admin', function () {
    it('TODO');
  });

  context('logged in as user', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));
    it('should return status 403 not authorized', function (done) {
      co(function *() {
        try {
          yield browser.visit(`/discussion/${existentDiscussion.id}/${existentDiscussion.url}/edit`);
        }
        catch(e) {}

        browser.assert.status(403);

        return done();
      })
      .catch(done);
    });
  });

  context('not logged in', function () {
    beforeEach(funcs.logout(browserObj));

    it('should return status 403 not authorized', function (done) {
      co(function *() {
        try {
          yield browser.visit(`/discussion/${existentDiscussion.id}/${existentDiscussion.url}/edit`);
        }
        catch(e) {}

        browser.assert.status(403);

        return done();
      })
      .catch(done);
    });
  });
});
