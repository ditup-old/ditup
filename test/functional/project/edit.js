'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbDataProjectJoin');
let generateUrl = require('../../../routes/collection/functions').generateUrl;

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('edit project', function () {
  let browserObj = {};
  let browser;

  let noRelationUser = dbData.users[0];
  let joiningUser = dbData.users[1];
  let creator = dbData.users[2];
  let invitedUser = dbData.users[2];
  let member = dbData.users[3];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  var existentProject = dbData.projects[0];
  
  context('logged in as member', function () {
    beforeEach(funcs.login(member, browserObj));
    afterEach(funcs.logout(browserObj));

    context('visit /project/id/name', function () {
      beforeEach(funcs.visit(()=>`/project/${existentProject.id}/${existentProject.url}`, browserObj));
      it('should show an edit button next to name', function () {
        browser.assert.element('.edit-project-name');
        browser.assert.link('a.edit-project-name', 'edit', `/project/${existentProject.id}/${existentProject.url}/edit?field=name`);
      });

      it('should show an edit button next to description', function () {
        browser.assert.element('.edit-project-description');
        browser.assert.link('a.edit-project-description', 'edit', `/project/${existentProject.id}/${existentProject.url}/edit?field=description`);
      });
    });

    context('visit /project/id/name/edit', function () {
      context('?field=name', function () {
        beforeEach(funcs.visit(()=>`/project/${existentProject.id}/${existentProject.url}/edit?field=name`, browserObj));

        it('should show form for editing project name', function () {
          browser.assert.element('form.edit-collection-name');
          browser.assert.input('form.edit-collection-name input[type=submit]', 'update name');
        });

        it('form filled with project name', function () {
          browser.assert.input('form.edit-collection-name input[type=text]', existentProject.name);
        });

        context('POST', function () {
          let newName = 'this is a new name';
          let newUrl = generateUrl(newName);
          beforeEach(funcs.fill(()=>`/project/${existentProject.id}/${existentProject.url}/edit?field=name`, {name: newName, submit: 'update name'}, browserObj));

          it('should update the name and redirect to the page', function () {
            browser.assert.redirected();
            browser.assert.url(`/project/${existentProject.id}/${newUrl}`);
            browser.assert.text('.collection-name', newName);
          });

          it('should say that the name was updated', function () {
            browser.assert.text('.popup-message', 'the name was updated');
          });
        });
      });

      context('?field=description', function () {
        beforeEach(funcs.visit(()=>`/project/${existentProject.id}/${existentProject.url}/edit?field=description`, browserObj));

        it('should show form for editing project description', function () {
          browser.assert.element('form.edit-collection-description');
          browser.assert.input('form.edit-collection-description input[type=submit]', 'update description');
        });

        it('form filled with project description', function () {
          browser.assert.input('form.edit-collection-description textarea', existentProject.description);
        });

        context('POST', function () {
          let newDescription = 'this is a new interesting description';
          beforeEach(funcs.fill(()=>`/project/${existentProject.id}/${existentProject.url}/edit?field=description`, {description: newDescription, submit: 'update description'}, browserObj));

          it('should update the description and redirect to the page', function () {
            browser.assert.redirected();
            browser.assert.url(`/project/${existentProject.id}/${existentProject.url}`);
            browser.assert.text('.collection-description', newDescription);
          });

          it('should say that the description was updated', function () {
            browser.assert.text('.popup-message', 'the description was updated');
          });
        });
      });
    });
  });

  context('logged in as admin', function () {
    it('TODO');
  });

  context('logged in as other user', function () {
    beforeEach(funcs.login(invitedUser, browserObj));
    afterEach(funcs.logout(browserObj));
    it('should return status 403 not authorized', function (done) {
      co(function *() {
        try {
          yield browser.visit(`/project/${existentProject.id}/${existentProject.url}/edit`);
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
          yield browser.visit(`/project/${existentProject.id}/${existentProject.url}/edit`);
        }
        catch(e) {}

        browser.assert.status(403);

        return done();
      })
      .catch(done);
    });
  });
});
