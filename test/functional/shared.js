'use strict';

exports.tags = function (collection, variables, settings) {
  var existentCollections = variables.existentCollections || [];
  //var collection = collection || (function () {throw new Error('give a collection name as a first argument');})();
  it('should show tags', function () {
    if(variables.hasOwnProperty('browser')){
      var browser = variables.browser.Value;
    }
    else {
      throw new Error('missing browser');
    }
    for(var ec of existentCollections){
      for(var i = ec.tags.length-1; i>=0; i--){
        browser.assert.text('#' + collection + '-tags', new RegExp(ec.tags[i]));
      }
    }
  });
};


exports.tags = function (collection, variables, dependencies, settings) {
  /**
    dependencies: app, session, data, generateUrl, Browser
  */
  // get the application server module
  //var app = dependencies.app;
  //var session = dependencies.session;

  var dbCollection = dependencies.data;
  //var generateUrl = dependencies.generateUrl;

  // use zombie.js as headless browser
  //var Browser = dependencies.Browser;
  describe('testing tags: visit /' + collection + '/:id/:name', function () {
    var server, browser;
    
    before(function () {
      server = dependencies.server.Value;//app(session).listen(3000);
    });

    before(function () {
      browser = dependencies.browser.Value;//new Browser({ site: 'http://localhost:3000' });
    });

    after(function (done) {
      //server.close(done);
      done();
    });

    var loggedUser = variables.loggedUser;

    function login (done) {
      browser.visit('/login')
        .then(() => {
          return browser.fill('username', loggedUser.username)
            .fill('password', loggedUser.password)
            .pressButton('log in');
        })
        .then(done, done);
    }

    function logout (done) {
      browser.visit('/logout')
        .then(done, done);
    }
    
    var existentCollections = variables.existentCollections;
    var nonexistentCollections = variables.nonexistentCollections;

    //create existent challenges for tests
    beforeEach(function (done) {

      let collectionPromises = [];
      for(let ec of existentCollections) {
        var cPromise = dbCollection.create({name: ec.name, description: ec.description, creator: ec.creator})
          .then(function (_id) {
            ec.id = _id.id;

            //add some tags to the existentCollection
            let tagPromises = [];
            for(let tag of ec.tags){
              tagPromises.push(dbCollection.addTag(ec.id, tag, 'test1'));
            }
            return Promise.all(tagPromises)
              .then(function () {});
          })
          .then(function () {
            let commentPromises = [];
            for(let co of ec.comments) {
              commentPromises.push(dbCollection.addComment(ec.id, {text: co.text}, co.author));
            }
            return Promise.all(commentPromises)
              .then(function (commentIds) {
                for(let i=0, len=commentIds.length; i<len; ++i) {
                  ec.comments[i].id = commentIds[i].id;
                }
              });
          });
        collectionPromises.push(cPromise);
      }

      Promise.all(collectionPromises)
        .then(function () {})
        .then(done, done);

    });
    
    //delete the existent challenge
    afterEach(function (done) {
      var challengePromises = [];
      for(let existentCollection of existentCollections) {
        challengePromises.push((function () {
          return removeTagsFrom(existentCollection)
            .then(function () {
              return dbCollection.delete(existentCollection.id);
            })
            .then(function () {
              return ;
            });
        })());
      }

      return Promise.all(challengePromises)
        .then(function () {})
        .then(done,done);
      //remove tags from the existentCollections

      function removeTagsFrom(existentCollection) {
        let tagPromises = [];
        for(let tag of existentCollection.tags){
          tagPromises.push(dbCollection.removeTag(existentCollection.id, tag));
        }
        return Promise.all(tagPromises)
          .then(function () {}, function (err) {})
          //delete the new challenge from database
          .then(function () {
            return;
          });
      
      }
    });

    for (let existentCollection of existentCollections) {
      context(collection + ' with :id exists', function () {
        context(':id and :name are valid', function () {
          beforeEach(function (done) {
            browser.visit('/'+collection+'/' + existentCollection.id + '/' + existentCollection.url)
              .then(done, done);
          });

          it('should show tags', function () {
            for(var i = existentCollection.tags.length-1; i>=0; i--){
              browser.assert.text('#challenge-tags', new RegExp(existentCollection.tags[i]));
            }
          });

          context('not logged in', function () {

            beforeEach(logout);

            beforeEach(function (done) {
              return browser.visit('/challenge/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

          });

          context('logged in', function () {
            beforeEach(login);

            beforeEach(function (done) {
              console.log(existentCollection, '**********************************88')
              browser.visit('/challenge/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

            afterEach(logout);

            it('should show link or field for adding a tag', function () {
              browser.assert.element('#add-tag-form');
              browser.assert.attribute('#add-tag-form', 'method', 'post');
              browser.assert.element('#add-tag-form input[type=text]');
              browser.assert.attribute('#add-tag-form input[type=text]', 'name', 'tagname');
              browser.assert.element('#add-tag-form input[type=submit]');
              browser.assert.attribute('#add-tag-form input[type=submit]', 'name', 'submit');
              browser.assert.attribute('#add-tag-form input[type=submit]', 'value', 'add tag');
            }); //challenge/id/name/add-tag
            it('may be possible to remove tags which user added and have 0 or negative voting');
            it('should show the tags to be votable (whether the tag is fitting or not)');

          });
        });

        context('POST', function () {
          context('logged in', function () {

            beforeEach(login);

            beforeEach(function (done) {
              browser.visit('/challenge/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

            afterEach(logout);

            context('adding a tag', function () {
              let tagToAdd = 'busking';
              //adding tag can be implemented with form action="" and in POST router we'll check by the correct form name or submit button
              beforeEach(function (done) {
                return browser
                  .fill('tagname', tagToAdd)
                  .pressButton('add tag')
                  .then(done, done);
              });

              afterEach(function (done) {
                return dbCollection.removeTag(existentCollection.id, tagToAdd)
                  .then(function () {done();}, done );
              });

              it('should add a tag and show it', function () {
                browser.assert.success();
                browser.assert.text('#challenge-tags', new RegExp(tagToAdd));
              });

              it('should display info that tag was successfully added', function () {
                browser.assert.text('div.popup-message.info', 'Tag ' + tagToAdd + ' was successfully added to the challenge.');
                browser.assert.link('div.popup-message.info a', tagToAdd, '/tag/'+tagToAdd);
              });
            });
          });
        });
      });
    }
  });
};
