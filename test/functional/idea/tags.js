'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
let dbData = require('./dbTags');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

//describe('/user/:username follow & unfollow user', function () {
describe('idea tags', function () {
  let browserObj = {};
  let browser;

  let loggedUser = dbData.users[0];
  let idea = dbData.ideas[0];

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  context('visit /idea/:id/:url', function () {
    beforeEach(funcs.visit(()=>`/idea/${idea.id}/${idea.url}`, browserObj));
    it('should show tags of idea', function () {
      browser.assert.element('.collection-tags');
      browser.assert.elements('.collection-tags .tag', dbData.tags.length-1);
    });

    context('user is logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      beforeEach(funcs.visit(()=>`/idea/${idea.id}/${idea.url}`, browserObj));
      afterEach(funcs.logout(browserObj));
      it('should show edit link', function () {
        browser.assert.link('a.edit-tags-link', 'add tags', `/idea/${idea.id}/${idea.url}/edit?field=tags`);
      });
    });

    context('user is not logged in', function () {
      beforeEach(funcs.logout(browserObj));
      it('should not show edit link', function () {
        browser.assert.elements('a.edit-tags-link', 0);
      });
    });
  });

  context('logged in', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    afterEach(funcs.logout(browserObj));

    context('click edit link', function () {
      beforeEach(funcs.visit(()=>`/idea/${idea.id}/${idea.url}`, browserObj));
      //clicking the edit link
      beforeEach(function (done) {
        co(function * () {
          yield browser.clickLink('add tags');
          done();
        }).catch(done);
      });

      it('should show the already added tags', function () {
        browser.assert.url(`/idea/${idea.id}/${idea.url}/edit?field=tags`);
        browser.assert.element('.collection-tags');
        browser.assert.elements('.collection-tags .tag', dbData.tags.length-1);
      });

      it('should show form for adding the tag', function () {
        browser.assert.element('.add-tag-form');
        browser.assert.element('.add-tag-form input[type=text][name=tagname]');
        browser.assert.input('.add-tag-form input[type=submit][name=action]', 'add tag');
      });
      it('should show cancel link', function () {
        browser.assert.link('.add-tag-form a', 'cancel', `/idea/${idea.id}/${idea.url}`);
      });
    });

    context('add the tag (POST)', function () {
      context('the tag exists', function () {
        context('idea is already tagged with this tag', function () {
          let addedTag = dbData.tags[0];
          beforeEach(funcs.fill(()=>`/idea/${idea.id}/${idea.url}/edit?field=tags`, {'.add-tag-form [name=tagname]': addedTag.name, submit: 'add tag'}, browserObj));

          it('should complain that the tag is already added and stay on the edit page', function () {
            browser.assert.text('.popup-message.info', `the tag ${addedTag.name} is already added`);
          });
        });

        context('idea is not tagged with the tag yet', function () {
          let nonAddedTag = dbData.tags[dbData.tags.length-1];
          beforeEach(funcs.fill(()=>`/idea/${idea.id}/${idea.url}/edit?field=tags`, {'.add-tag-form [name=tagname]': nonAddedTag.name, submit: 'add tag'}, browserObj));

          it('should add the tag to idea and go back to the edit tags page', function () {
            browser.assert.url(`/idea/${idea.id}/${idea.url}`);
            browser.assert.elements('.tag', dbData.tags.length);
          });

          it('should say that the tag was added', function () {
            browser.assert.text('.popup-message.info', `the tag ${nonAddedTag.name} was added to the idea ${idea.name}`);
          });
        });
      });

      context('the tag doesn\'t exist', function () {
        it('should show a form to create a new tag');
        it('should offer submitting the new tag : create and add to idea');
        it('should offer cancelling');

        context('POST the new tag', function () {
          it('should create and add the tag to idea and go back to the edit tags page');
          it('should say that the tag was created and added to the idea');
        });
      });
    });

    context('voting for tags', function () {
      it('TODO');
      //voting up
      //voting down
      //show votes which user did
      //show tags user voted for first
      //if voted, cannot do the same vote
    });
  });
  
  /*context('visit /user/:username', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    beforeEach(funcs.visit(`/user/${otherUser.username}`, browserObj));
    afterEach(funcs.logout(browserObj));

    it('should show tags which belong to the user', function () {
      browser.assert.element('.user-tags');
      browser.assert.elements('.user-tags .tag', dbData.tags.length-3);
    });

    context('user is logged in & herself', function () {
      beforeEach(funcs.visit(`/user/${loggedUser.username}`, browserObj));

      it('should show edit link', function () {
        browser.assert.link('a.edit-tags-link', 'edit tags', `/user/${loggedUser.username}/edit?field=tags`);
      });
    });

    context('user is not self OR not logged in', function () {
      it('should not show edit link', function () {
        browser.assert.elements('a.edit-tags-link', 0);
      });
    });
  });
  // */
  /*
  context('logged in & herself', function () {
    // **** preparation **** //
    //logging in
    beforeEach(funcs.login(loggedUser, browserObj));
    //visiting user profile
    beforeEach(funcs.visit(`/user/${loggedUser.username}`, browserObj));
    //log out after
    afterEach(funcs.logout(browserObj));
    
    //*
    context('click edit link', function () {
      //clicking the edit link
      beforeEach(function (done) {
        co(function * () {
          yield browser.clickLink('edit tags');
          done();
        }).catch(done);
      });

      it('should show the already added tags', function () {
        browser.assert.url(`/user/${loggedUser.username}/edit?field=tags`);
        browser.assert.element('.user-tags');
        browser.assert.elements('.user-tags .tag', dbData.tags.length-1);
      });

      it('should show form for adding the tag', function () {
        browser.assert.element('.add-tag-form');
        browser.assert.element('.add-tag-form input[type=text][name=tagname]');
        browser.assert.input('.add-tag-form input[type=submit][name=action]', 'add tag');
      });
      it('should show cancel link', function () {
        browser.assert.link('.add-tag-form a', 'cancel', `/user/${loggedUser.username}`);
      });

      it('should show cross to remove tag', function () {
        browser.assert.elements('.tag .remove-tag-form', dbData.tags.length-1);
        browser.assert.element('.tag .remove-tag-form input[type=hidden][name=tagname][value="tag0"]');
        browser.assert.elements('.tag .remove-tag-form input[name=action][value="remove tag"]', dbData.tags.length-1);
        browser.assert.elements('.tag .remove-tag-form [type=submit]', dbData.tags.length-1);
      });
    });
    // * /

    // *
    context('add the tag (POST)', function () {
      context('the tag exists', function () {
        context('user already has the tag', function () {
          let addedTag = dbData.tags[0];
          beforeEach(funcs.fill(`/user/${loggedUser.username}/edit?field=tags`, {'.add-tag-form [name=tagname]': addedTag.name, submit: 'add tag'}, browserObj));

          it('should complain that the tag is already added and stay on the edit page', function () {
            browser.assert.text('.popup-message.info', `the tag ${addedTag.name} is already added`);
          });
        });

        context('user doesn\'t have the tag', function () {
          let nonAddedTag = dbData.tags[dbData.tags.length-1];
          beforeEach(funcs.fill(`/user/${loggedUser.username}/edit?field=tags`, {'.add-tag-form [name=tagname]': nonAddedTag.name, submit: 'add tag'}, browserObj));

          it('should add the tag to user and go back to the edit tags page', function () {
            browser.assert.url(`/user/${loggedUser.username}/edit?field=tags`);
            browser.assert.elements('.tag', dbData.tags.length);
          });

          it('should say that the tag was added', function () {
            browser.assert.text('.popup-message.info', `the tag ${nonAddedTag.name} was added to your profile`);
          });
        });
      });

      context('the tag doesn\'t exist', function () {
        let nonExistentTag = {name: 'nonexistent-tag', description: 'this tag doesn\'t exist, yet'};
        beforeEach(funcs.fill(`/user/${loggedUser.username}/edit?field=tags`, {'.add-tag-form [name=tagname]': nonExistentTag.name, submit: 'add tag'}, browserObj));
        it('should show a form to create a new tag', function () {
          browser.assert.element('.create-add-tag-form');
          browser.assert.input('.create-add-tag-form input[type=hidden][name=tagname]', nonExistentTag.name);
          browser.assert.element('.create-add-tag-form textarea[name=description]');
        });
        it('should offer submitting the new tag : create and add to my profile', function () {
          browser.assert.input('.create-add-tag-form [type=submit][name=action]', 'create and add tag');
        });
        it('should offer cancelling', function () {
          browser.assert.link('.create-add-tag-form a', 'cancel', `/user/${loggedUser.username}/edit?field=tags`);
        });

        context('POST the new tag', function () {
          beforeEach(function (done) {
            co(function * () {
              yield browser.fill('.create-add-tag-form [name=description]', nonExistentTag.description)
                .pressButton('.create-add-tag-form [name=action]');
              done();

            }).catch(done);
          });

          it('should create and add the tag to user and go back to the edit tags page', function () {
            browser.assert.elements('.tag', dbData.tags.length);
          });

          it('should say that the tag was created and added to the user', function () {
            browser.assert.text('.popup-message.info', `the tag ${nonExistentTag.name} was created and added to your profile`);
          });
        });
      });
    });
    // * /

    context('remove the tag (POST)', function () {
      beforeEach(funcs.fill(`/user/${loggedUser.username}/edit?field=tags`, {submit: '.remove-tag-form [type=submit]'}, browserObj));
      it('should remove the tag from the user', function () {
        browser.assert.elements('.tag', dbData.tags.length-2);
      });
    });
  });
  // */

  /*context('not herself', function () {
    beforeEach(funcs.login(loggedUser, browserObj));
    //visiting user profile
    it('show not authorized', function (done) {
      co(function * () {
        try{
          yield browser.visit(`/user/${otherUser.username}/edit?field=tags`);
        }
        catch(err){}
        browser.assert.status(403);
        done();
      }).catch(done);
    });
  });
  */
});
