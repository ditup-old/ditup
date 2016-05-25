'use strict';

function createCollectionsInDatabase(existentCollections, dbCollection) {
  return function (done) {
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
  };
}

function removeCollectionsFromDatabase(existentCollections, dbCollection) {
  return function (done) {
    var collectionPromises = [];
    for(let existentCollection of existentCollections) {
      collectionPromises.push((function () {
        return removeTagsFrom(existentCollection)
          .then(function () {
            return dbCollection.delete(existentCollection.id);
          })
          .then(function () {
            return ;
          });
      })());
    }

    return Promise.all(collectionPromises)
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
        //delete the new ' + collection + ' from database
        .then(function () {
          return;
        });
    
    }
  };
}

exports.tags = function (collection, variables, dependencies, settings) {
  /**
    dependencies: server, browser (in pseudopointer form) browser: {Value: browser}
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

    //create existent ' + collection + 's for tests
    //beforeEach(createCollectionsInDatabase(existentCollections, dbCollection));
    
    //delete the existent ' + collection + '
    //afterEach(removeCollectionsFromDatabase(existentCollections, dbCollection));

    for (let existentCollection of existentCollections) {
      context(collection + ' with :id exists', function () {
        context(':id and :name are valid', function () {
          beforeEach(function (done) {
            browser.visit('/'+collection+'/' + existentCollection.id + '/' + existentCollection.url)
              .then(done, done);
          });

          it('should show tags', function () {
            for(var i = existentCollection.tags.length-1; i>=0; i--){
              browser.assert.text('#' + collection + '-tags', new RegExp(existentCollection.tags[i]));
            }
          });

          context('not logged in', function () {

            beforeEach(logout);

            beforeEach(function (done) {
              return browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

          });

          context('logged in', function () {
            beforeEach(login);

            beforeEach(function (done) {
              browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
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
            }); //' + collection + '/id/name/add-tag
            it('may be possible to remove tags which user added and have 0 or negative voting');
            it('should show the tags to be votable (whether the tag is fitting or not)');

          });
        });

        context('POST', function () {
          context('logged in', function () {

            beforeEach(login);

            beforeEach(function (done) {
              browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
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

              /*afterEach(function (done) {
                return dbCollection.removeTag(existentCollection.id, tagToAdd)
                  .then(function () {done();}, done );
              });
              */

              it('should add a tag and show it', function () {
                browser.assert.success();
                browser.assert.text('#' + collection + '-tags', new RegExp(tagToAdd));
              });

              it('should display info that tag was successfully added', function () {
                browser.assert.text('div.popup-message.info', 'Tag ' + tagToAdd + ' was successfully added to the ' + collection + '.');
                browser.assert.link('div.popup-message.info a', tagToAdd, '/tag/'+tagToAdd);
              });
            });
          });
        });
      });
    }
  });
};

exports.share = function (collection, variables, dependencies, settings) {
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
  describe('testing share: visit /' + collection + '/:id/:name', function () {
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

    //create existent ' + collection + 's for tests
    beforeEach(createCollectionsInDatabase(existentCollections, dbCollection));
    
    //delete the existent ' + collection + '
    afterEach(removeCollectionsFromDatabase(existentCollections, dbCollection));


    for(var existentCollection of existentCollections) {
      context('' + collection + ' with :id exists', function () {

        context(':id and :name are valid', function () {
          beforeEach(function (done) {
            browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
              .then(done, done);
          });

          it('should show link for sharing the ' + collection + '', function () {
            browser.assert.input('#' + collection + '-url', browser.url);
            //browser.assert.input('#' + collection + '-url-short', 'http://localhost:3000/c/'+existentCollection.id);
            //TODO!!! check how it works in html on i.e. github...
          });

          it('should show social networking links for sharing');
          /**how does social networking work???*/
        });
      });
    }
  });
};

exports.comment = function (collection, variables, dependencies, settings) {
  /**
    dependencies: app, session, data, generateUrl, Browser
  */
  // get the application server module
  //var app = dependencies.app;
  //var session = dependencies.session;

  var dbCollection = dependencies.data;
  var db = dependencies.db;
  //var generateUrl = dependencies.generateUrl;

  // use zombie.js as headless browser
  //var Browser = dependencies.Browser;
  describe('testing comments: visit /' + collection + '/:id/:name', function () {
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

    //create existent ' + collection + 's for tests
    beforeEach(createCollectionsInDatabase(existentCollections, dbCollection));
    
    //delete the existent ' + collection + '
    afterEach(removeCollectionsFromDatabase(existentCollections, dbCollection));

    for(var existentCollection of existentCollections) {
      context('' + collection + ' with :id exists', function () {
        context(':id and :name are valid', function () {
          beforeEach(function (done) {
            browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
              .then(done, done);
          });

          it('should show comments', function () {
            for(let co of existentCollection.comments) {
              browser.assert.text('#' + collection + '-comment-'+co.id+'>.' + collection + '-comment-text', co.text);
              browser.assert.link('#' + collection + '-comment-'+co.id+'>a.' + collection + '-comment-author', co.author, '/user/'+co.author);
            }
          });

          context('logged in', function () {
            beforeEach(login);

            beforeEach(function (done) {
              browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

            afterEach(logout);

            //' + collection + '/id/name/add-tag
            it('should show a field for adding a comment to ' + collection + '', function () {
              browser.assert.element('#comment-form');
              browser.assert.attribute('#comment-form', 'method', 'post');
              browser.assert.element('#comment-form textarea');
              browser.assert.attribute('#comment-form textarea', 'name', 'comment');
              browser.assert.element('#comment-form input[type=submit]');
              browser.assert.attribute('#comment-form input[type=submit]', 'name', 'submit');
              browser.assert.attribute('#comment-form input[type=submit]', 'value', 'comment');
            });
            it('should show links to reacting to comments');
            
            it('should show the buttons to edit or delete comments when user is the author', function () {
              for(let co of existentCollection.comments) {
                if(loggedUser.username === co.author) {
                  browser.assert.element('#' + collection + '-comment-'+co.id+' .edit-comment-form');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .edit-comment-form', 'method', 'post');
                  browser.assert.element('#' + collection + '-comment-'+co.id+' .edit-comment-form input[type=hidden]');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .edit-comment-form input[type=hidden]', 'name', 'comment-id');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .edit-comment-form input[type=hidden]', 'value', co.id);
                  browser.assert.element('#' + collection + '-comment-'+co.id+' .edit-comment-form input[type=submit]');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .edit-comment-form input[type=submit]', 'name', 'submit');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .edit-comment-form input[type=submit]', 'value', 'edit comment');
                  //remove comment form
                  browser.assert.element('#' + collection + '-comment-'+co.id+' .remove-comment-form');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .remove-comment-form', 'method', 'post');
                  browser.assert.element('#' + collection + '-comment-'+co.id+' .remove-comment-form input[type=hidden]');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .remove-comment-form input[type=hidden]', 'name', 'comment-id');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .remove-comment-form input[type=hidden]', 'value', co.id);
                  browser.assert.element('#' + collection + '-comment-'+co.id+' .remove-comment-form input[type=submit]');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .remove-comment-form input[type=submit]', 'name', 'submit');
                  browser.assert.attribute('#' + collection + '-comment-'+co.id+' .remove-comment-form input[type=submit]', 'value', 'remove comment');
                }
                else {
                  browser.assert.elements('#' + collection + '-comment-'+co.id+' .edit-comment-form', 0);
                  //remove comment form
                  browser.assert.elements('#' + collection + '-comment-'+co.id+' .remove-comment-form', 0);
                }
              }
            });
          });
        });

        context('POST', function () {
          context('logged in', function () {

            beforeEach(login);

            beforeEach(function (done) {
              browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

            afterEach(logout);

            context('adding a comment', function () {
              let commentToAdd = {text: 'this is some comment', id: ''};
              //adding tag can be implemented with form action="" and in POST router we'll check by the correct form name or submit button
              beforeEach(function (done) {
                return browser
                  .fill('comment', commentToAdd.text)
                  .pressButton('comment')
                  .then(done, done);
              });

              afterEach(function (done) {
                return db.query('FOR cca IN ' + collection + 'CommentAuthor REMOVE cca IN ' + collection + 'CommentAuthor', {})
                  .then(function () {done();}, done );
              });

              it('should add the comment and show it', function () {
                browser.assert.success();
                browser.assert.text('.' + collection + '-comment', new RegExp(commentToAdd.text));
              });

              it('should display info that the comment was successfully added', function () {
                browser.assert.text('div.popup-message.info', new RegExp('The comment was successfully added to the ' + collection + '\\.'));
              });
            });

            context('removing a comment', function () {
              let commentToAdd = {text: 'this is some comment', id: ''};
              //adding tag can be implemented with form action="" and in POST router we'll check by the correct form name or submit button
              beforeEach(function (done) {
                return browser
                  .pressButton('remove comment')
                  .then(done, done);
              });

              afterEach(function (done) {
                return db.query('FOR cca IN ' + collection + 'CommentAuthor REMOVE cca IN ' + collection + 'CommentAuthor', {})
                  .then(function () {done();}, done );
              });

              it('should remove the comment', function () {
                browser.assert.success();
                //browser.assert.text('.' + collection + '-comment', new RegExp(commentToAdd.text));
                //how to test that the comment is not present?
              });

              it('should display info that the comment was successfully removed', function () {
                browser.assert.text('div.popup-message.info', new RegExp('The comment was successfully removed\\.'));
              });
            });
          });
        });
      });
    }
  });
};

exports.follow = function (collection, variables, dependencies, settings) {
  /**
    dependencies: app, session, data, generateUrl, Browser
  */
  // get the application server module
  //var app = dependencies.app;
  //var session = dependencies.session;

  var dbCollection = dependencies.data;
  var db = dependencies.db;
  //var generateUrl = dependencies.generateUrl;

  // use zombie.js as headless browser
  //var Browser = dependencies.Browser;
  describe('testing follow: visit /' + collection + '/:id/:name', function () {
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

    //create existent ' + collection + 's for tests
    beforeEach(createCollectionsInDatabase(existentCollections, dbCollection));
    
    //delete the existent ' + collection + '
    afterEach(removeCollectionsFromDatabase(existentCollections, dbCollection));

    for(var existentCollection of existentCollections) {
      context('' + collection + ' with :id exists', function () {
        context(':id and :name are valid', function () {
          beforeEach(function (done) {
            browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
              .then(done, done);
          });

          it('should show followers');

          context('logged in', function () {
            beforeEach(login);

            beforeEach(function (done) {
              browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

            afterEach(logout);

            context('user doesn\'t follow', function () {
              it('should show a \'follow\' button', function () {
                browser.assert.element('#follow-form');
                browser.assert.attribute('#follow-form', 'method', 'post');
                browser.assert.element('#follow-form input[type=submit]');
                browser.assert.attribute('#follow-form input[type=submit]', 'name', 'submit');
                browser.assert.attribute('#follow-form input[type=submit]', 'value', 'follow');
              });
            });

            context('user follows', function () {
              beforeEach(function (done) {
                return dbCollection.follow(existentCollection.id, 'test1')
                  .then(function (_out) {
                    done();
                  }, done);
              });

              beforeEach(function (done) {
                browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                  .then(done, done);
              });

              afterEach(function (done) {
                return dbCollection.unfollow(existentCollection.id, 'test1')
                  .then(function (_out) {
                    done();
                  }, done);
              });

              it('should show an \'unfollow\' button', function () {
                browser.assert.element('#unfollow-form');
                browser.assert.attribute('#unfollow-form', 'method', 'post');
                browser.assert.element('#unfollow-form input[type=submit]');
                browser.assert.attribute('#unfollow-form input[type=submit]', 'name', 'submit');
                browser.assert.attribute('#unfollow-form input[type=submit]', 'value', 'unfollow');
              });
            });

            context('user doesn\'t hide the ' + collection + '', function () {
              it('should show a hide button', function () {
                browser.assert.element('#hide-form');
                browser.assert.attribute('#hide-form', 'method', 'post');
                browser.assert.element('#hide-form input[type=submit]');
                browser.assert.attribute('#hide-form input[type=submit]', 'name', 'submit');
                browser.assert.attribute('#hide-form input[type=submit]', 'value', 'hide');
              });
            });

            context('user hides the ' + collection + '', function () {
              beforeEach(function (done) {
                return dbCollection.hide(existentCollection.id, 'test1')
                  .then(function (_out) {
                    done();
                  }, done);
              });

              beforeEach(function (done) {
                browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                  .then(done, done);
              });

              afterEach(function (done) {
                return dbCollection.unhide(existentCollection.id, 'test1')
                  .then(function (_out) {
                    done();
                  }, done);
              });

              it('should show an unhide button', function () {
                browser.assert.element('#unhide-form');
                browser.assert.attribute('#unhide-form', 'method', 'post');
                browser.assert.element('#unhide-form input[type=submit]');
                browser.assert.attribute('#unhide-form input[type=submit]', 'name', 'submit');
                browser.assert.attribute('#unhide-form input[type=submit]', 'value', 'unhide');
              });
            });
          });
        });

        context('POST', function () {
          context('logged in', function () {

            beforeEach(login);

            beforeEach(function (done) {
              browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                .then(done, done);
            });

            afterEach(logout);

            function pressJustAButton(buttonName) {
              return function (done) {
                return browser
                  .pressButton(buttonName)
                  .then(done, done);
              };
            }

            context('follow', function () {
              beforeEach(pressJustAButton('follow'));

              afterEach(function (done) {
                return dbCollection.unfollow(existentCollection.id, loggedUser.username)
                  .then(function () {done();}, done );
              });
              
              it('should make user follow the ' + collection + ' and update the button to unfollow', function () {
                browser.assert.success();
                browser.assert.element('#unfollow-form');
              });

              it('should display info that user now follows the ' + collection + '', function () {
                browser.assert.text('div.popup-message.info', new RegExp('Now you follow the ' + collection + '\\.'));
              });
            });

            context('unfollow', function () {
              beforeEach(function (done) {
                return dbCollection.follow(existentCollection.id, 'test1')
                  .then(function (_out) {
                    done();
                  }, done);
              });

              beforeEach(function (done) {
                browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                  .then(done, done);
              });

              beforeEach(pressJustAButton('unfollow'));

              afterEach(function (done) {
                return dbCollection.unfollow(existentCollection.id, 'test1')
                  .then(null, function (err) {
                    if(err.message !== '404') {
                      throw err;
                    }
                  })
                  .then(function (_out) {
                    done();
                  }, done);
              });

              it('should make user unfollow the ' + collection + ' and update the button to follow', function () {
                browser.assert.success();
                browser.assert.element('#follow-form');
              });

              it('should display info that user now follows the ' + collection + '', function () {
                browser.assert.text('div.popup-message.info', new RegExp('You don\'t follow the ' + collection + ' anymore\\.'));
              });
            });

            context('hide', function () {
              beforeEach(pressJustAButton('hide'));

              afterEach(function (done) {
                return dbCollection.unhide(existentCollection.id, loggedUser.username)
                  .then(function () {done();}, done );
              });
              
              it('should make the ' + collection + ' hidden and update the button to unhide', function (){
                browser.assert.success();
                browser.assert.element('#unhide-form');
              });

              it('should display info that the ' + collection + ' won\'t be shown in searches', function (){
                browser.assert.text('div.popup-message.info', new RegExp('The ' + collection + ' won\'t be shown in your search results anymore\\.'));
              });
            });

            context('unhide', function () {
              beforeEach(function (done) {
                return dbCollection.hide(existentCollection.id, loggedUser.username)
                  .then(function (_out) {
                    done();
                  }, done);
              });

              beforeEach(function (done) {
                browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
                  .then(done, done);
              });

              beforeEach(pressJustAButton('unhide'));

              afterEach(function (done) {
                return dbCollection.unfollow(existentCollection.id, 'test1')
                  .then(null, function (err) {
                    if(err.message !== '404') {
                      throw err;
                    }
                  })
                  .then(function (_out) {
                    done();
                  }, done);
              });

              it('should unhide the ' + collection + ' and update the button to hide', function (){
                browser.assert.success();
                browser.assert.element('#hide-form');
              });

              it('should display info that the ' + collection + ' will be shown in searches again', function (){
                browser.assert.text('div.popup-message.info', new RegExp('The ' + collection + ' will be shown in your search results again\\.'));
              });
            });
          });
        });
      });
    }
  });
};

exports.watch = exports.follow;
exports.star;
