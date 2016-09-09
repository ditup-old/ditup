'use strict';

module.exports = function (collectionName) { 

  let isProject = collectionName === 'project';

  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require(`../${collectionName}/dbTags`);

  let deps = config.init({db: dbConfig}, dbData);
  let funcs = config.funcs;
  let co = require('co');

  //describe('/user/:username follow & unfollow user', function () {
  describe(`${collectionName} tags`, function () {
    let browserObj = {};
    let browser;

    let loggedUser = dbData.users[0];

    if(isProject) {
      var member = dbData.users[1];
    }

    var collection = dbData[`${collectionName}s`][0];

    config.beforeTest(browserObj, deps);

    beforeEach(function () {
      browser = browserObj.Value;
    });
    
    //*
    context(`visit /${collectionName}/:id/:url`, function () {
      beforeEach(funcs.visit(()=>`/${collectionName}/${collection.id}/${collection.url}`, browserObj));
      it(`should show tags of ${collectionName}`, function () {
        browser.assert.element('.collection-tags');
        browser.assert.elements('.collection-tags .tag', dbData.tags.length-1);
      });

      context(isProject ? 'user is member' : 'user is logged in', function () {
        if(isProject) {
          beforeEach(funcs.login(member, browserObj));
        }
        else {
          beforeEach(funcs.login(loggedUser, browserObj));
        }
        beforeEach(funcs.visit(()=>`/${collectionName}/${collection.id}/${collection.url}`, browserObj));
        afterEach(funcs.logout(browserObj));

        it('should show edit link', function () {
          browser.assert.link('a.edit-tags-link', isProject ? 'edit tags' : 'add tags', `/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`);
        });
      });
      
      if(isProject) {
        context('user is not member', function () {
          beforeEach(funcs.login(loggedUser, browserObj));
          beforeEach(funcs.visit(()=>`/${collectionName}/${collection.id}/${collection.url}`, browserObj));
          afterEach(funcs.logout(browserObj));
          it('should not show edit link', function () {
            browser.assert.elements('a.edit-tags-link', 0);
          });
        });
      }

      context('user is not logged in', function () {
        beforeEach(funcs.logout(browserObj));
        beforeEach(funcs.visit(()=>`/${collectionName}/${collection.id}/${collection.url}`, browserObj));

        it('should not show edit link', function () {
          browser.assert.elements('a.edit-tags-link', 0);
        });
      });
    });
    // */

    context(isProject ? 'member' : 'logged in', function () {
      if(isProject) {
        beforeEach(funcs.login(member, browserObj));
      }
      else {
        beforeEach(funcs.login(loggedUser, browserObj));
      }
      afterEach(funcs.logout(browserObj));
      
      //*
      context('click edit link', function () {
        beforeEach(funcs.visit(()=>`/${collectionName}/${collection.id}/${collection.url}`, browserObj));
        //clicking the edit link
        beforeEach(function (done) {
          co(function * () {
            yield browser.clickLink('a.edit-tags-link');
            done();
          }).catch(done);
        });

        it('should show the already added tags', function () {
          browser.assert.url(`/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`);
          browser.assert.element('.collection-tags');
          browser.assert.elements('.collection-tags .tag', dbData.tags.length-1);
        });

        it('should show form for adding the tag', function () {
          browser.assert.element('.add-tag-form');
          browser.assert.element('.add-tag-form input[type=text][name=tagname]');
          browser.assert.input('.add-tag-form input[type=submit][name=action]', 'add tag');
        });

        it('should show cancel link', function () {
          browser.assert.link('.add-tag-form a', 'cancel', `/${collectionName}/${collection.id}/${collection.url}`);
        });
        
        if(isProject) {
          it('should show cross to remove tag', function () {
            browser.assert.elements('.tag .remove-tag-form', dbData.tags.length-1);
            browser.assert.element('.tag .remove-tag-form input[type=hidden][name=tagname][value="tag0"]');
            browser.assert.elements('.tag .remove-tag-form input[name=action][value="remove tag"]', dbData.tags.length-1);
            browser.assert.elements('.tag .remove-tag-form [type=submit]', dbData.tags.length-1);
          });
        }
      });
      // */

      context('add the tag (POST)', function () {
        let longString = '01234567';
        for(let i=0;i<10;++i){
          longString += longString;
        }

        let invalidTag = {
          tagname: 'some Invalid-tagname',
          description: longString
        };

        context('invalid data [tagname]', function () {
          beforeEach(funcs.fill(()=>`/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`, {'.add-tag-form [name=tagname]': invalidTag.tagname, submit: 'add tag'}, browserObj));

          it('should complain about invalid tagname', function () {
            browser.assert.text('.popup-message', `the tagname is invalid. it should look like 'simplename' or 'some-longer-tagname'.`);
          });

          it('should keep the data in the form');
        });

        context('the tag exists', function () {
          context(`${collectionName} is already tagged with this tag`, function () {
            let addedTag = dbData.tags[0];
            beforeEach(funcs.fill(()=>`/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`, {'.add-tag-form [name=tagname]': addedTag.name, submit: 'add tag'}, browserObj));

            it('should complain that the tag is already added and stay on the edit page', function () {
              browser.assert.text('.popup-message.info', `the tag ${addedTag.name} is already added`);
            });
          });

          context(`${collectionName} is not tagged with the tag yet`, function () {
            let nonAddedTag = dbData.tags[dbData.tags.length-1];
            beforeEach(funcs.fill(()=>`/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`, {'.add-tag-form [name=tagname]': nonAddedTag.name, submit: 'add tag'}, browserObj));

            it(`should add the tag to ${collectionName} and go back to the edit tags page`, function () {
              browser.assert.url(`/${collectionName}/${collection.id}/${collection.url}`);
              browser.assert.elements('.tag', dbData.tags.length);
            });

            it('should say that the tag was added', function () {
              browser.assert.text('.popup-message.info', `the tag ${nonAddedTag.name} was added to the ${collectionName}`);
            });
          });
        });

        context('the tag doesn\'t exist', function () {
          let nonExistentTag = {name: 'nonexistent-tag', description: 'this tag doesn\'t exist, yet'};
          beforeEach(funcs.fill(()=>`/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`, {'.add-tag-form [name=tagname]': nonExistentTag.name, submit: 'add tag'}, browserObj));
          it('should show a form to create a new tag', function () {
            browser.assert.element('.create-add-tag-form');
            browser.assert.input('.create-add-tag-form input[type=hidden][name=tagname]', nonExistentTag.name);
            browser.assert.element('.create-add-tag-form textarea[name=description]');
          });

          it('should offer submitting the new tag : create and add to my profile', function () {
            browser.assert.input('.create-add-tag-form [type=submit][name=action]', 'create and add tag');
          });

          it('should offer cancelling', function () {
            browser.assert.link('.create-add-tag-form a', 'cancel', `/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`);
          });

          context('POST the new tag', function () {
            context('valid data', function () {
              beforeEach(function (done) {
                co(function * () {
                  yield browser.fill('.create-add-tag-form [name=description]', nonExistentTag.description)
                    .pressButton('.create-add-tag-form [name=action]');
                  done();

                }).catch(done);
              });

              it(`should create and add the tag to ${collectionName} and go back to the edit tags page`, function () {
                browser.assert.elements('.tag', dbData.tags.length);
              });

              it(`should say that the tag was created and added to the ${collectionName}`, function () {
                browser.assert.text('.popup-message.info', `the tag ${nonExistentTag.name} was created and added to the ${collectionName}`);
              });
            }); 

            context('invalid data [tagname]', function () {
              it('is hard to test at this point');
            });

            context('invalid data [description]', function () {
              beforeEach(function (done) {
                co(function * () {
                  yield browser.fill('.create-add-tag-form [name=description]', invalidTag.description)
                    .pressButton('.create-add-tag-form [name=action]');
                  done();

                }).catch(done);
              });

              it('should complain about invalid tagname', function () {
                browser.assert.text('.popup-message', `the maximal length of description is 2048`);
              });

              it('should keep the data in the form');
            });
          });
        });
      });

      if(isProject) {
        context('remove the tag (POST)', function () {
          beforeEach(funcs.fill(() => `/${collectionName}/${collection.id}/${collection.url}/edit?field=tags`, {submit: '.remove-tag-form [type=submit]'}, browserObj));
          it('should remove the tag from the user', function () {
            browser.assert.elements('.tag', dbData.tags.length-2);
          });
        });
      }
      
      if(!isProject) {
        context('voting for tags', function () {
          it('TODO');
          //voting up
          //voting down
          //show votes which user did
          //show tags user voted for first
          //if voted, cannot do the same vote
        });
      }
    });
  });
};
