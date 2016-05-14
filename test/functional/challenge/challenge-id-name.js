'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');

var Database = require('arangojs');
var config = require('../../../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});
var dbChallenge = require('../../../services/data/challenge')(db);
var generateUrl = require('../../../routes/discussion/functions').generateUrl;

var shared = require('../shared');

// use zombie.js as headless browser
var Browser = require('zombie');
describe('visit /challenge/:id/:name', function () {
  var server, browser;
  var browserObj = {};
  var serverObj = {};
  
  before(function () {
    server = app(session).listen(3000);
    serverObj.Value = server;
    browser = new Browser({ site: 'http://localhost:3000' });
    browserObj.Value = browser;
  });

  after(function (done) {
    server.close(done);
  });

  var loggedUser = {username: 'test1', password: 'asdfasdf'};

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
  
  var existentChallenge = {name: 'new test challenge', description: 'some description', id: undefined, tags: ['test-tag-3', 'test-tag-1'], creator: 'test1'};
  existentChallenge.comments = [
    {text: 'this is a comment added by test1', author: 'test1'},
    {text: 'this is a comment added by test11', author: 'test11'},
    {text: 'this is a comment added by test5', author: 'test5'},
    {text: 'this is a comment added by test4', author: 'test4'}
  ]
  var nonexistentChallenge = {name: 'nonexistent challenge', description: 'some description', id: '1234567890'};
  existentChallenge.url = generateUrl(existentChallenge.name);
  nonexistentChallenge.url = generateUrl(nonexistentChallenge.name);

  shared.tags('challenge', { existentCollections: [existentChallenge], loggedUser: loggedUser }, {browser: browserObj, server: serverObj, data: dbChallenge}, {});
  shared.share('challenge', { existentCollections: [existentChallenge], loggedUser: loggedUser }, {browser: browserObj, server: serverObj, data: dbChallenge}, {});
  shared.comment('challenge', { existentCollections: [existentChallenge], loggedUser: loggedUser }, {browser: browserObj, server: serverObj, data: dbChallenge, db: db}, {});
  //create an existent challenge for tests
  beforeEach(function (done) {
    return dbChallenge.create({name: existentChallenge.name, description: existentChallenge.description, creator: 'test1'})
      .then(function (_id) {
        existentChallenge.id = _id.id;

        //add some tags to the existentChallenge
        let tagPromises = [];
        for(let tag of existentChallenge.tags){
          tagPromises.push(dbChallenge.addTag(existentChallenge.id, tag, 'test1'));
        }
        return Promise.all(tagPromises);
      })
      .then(function () {
        let commentPromises = [];
        for(let co of existentChallenge.comments) {
          commentPromises.push(dbChallenge.addComment(existentChallenge.id, {text: co.text}, co.author));
        }
        return Promise.all(commentPromises)
          .then(function (commentIds) {
            for(let i=0, len=commentIds.length; i<len; ++i) {
              existentChallenge.comments[i].id = commentIds[i].id;
            }
          });
      })
      .then(function () {
        done();
      })
      .then(null, done);
    //create the challenge
    //add some posts

  });
  
  //delete the existent challenge
  afterEach(function (done) {
    //remove tags from the existentChallenge
    let tagPromises = [];
    for(let tag of existentChallenge.tags){
      tagPromises.push(dbChallenge.removeTag(existentChallenge.id, tag));
    }
    return Promise.all(tagPromises)
      .then(function () {}, function (err) {})
      //delete the new challenge from database
      .then(function () {
        dbChallenge.delete(existentChallenge.id);
      })
      .then(function () {done();}, done);
  });

  context('challenge with :id exists', function () {
    context(':id not fitting to :name', function () {
      it('should permanent redirect to the correct name', function (done) {
        browser.visit('/challenge/' + existentChallenge.id + '/' + 'random-url')
          .then(function () {
            browser.assert.success();
            browser.assert.redirected();
            browser.assert.url(new RegExp('^.*/challenge/'+ existentChallenge.id + '/' + existentChallenge.url + '/?$'));
          })
          .then(done, done);
      });
    });

    context(':id without :name', function () {
      it('should permanent redirect to the correct name', function (done) {
        browser.visit('/challenge/' + existentChallenge.id)
          .then(function () {
            browser.assert.success();
            browser.assert.redirected();
            browser.assert.url(new RegExp('^.*/challenge/'+ existentChallenge.id + '/' + existentChallenge.url + '/?$'));
          })
          .then(done, done);
      });
    });

    context(':id and :name are valid', function () {
      beforeEach(function (done) {
        browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
          .then(done, done);
      });

      it('should show the challenge name and description', function () {
        browser.assert.text('#challenge-name', existentChallenge.name);
        browser.assert.text('#challenge-description', existentChallenge.description);
      });
      it('should show activity log');

      it('should show followers');
      it('should show stars')
      it('should show the challenges, tags, followers, stars, etc.');
      context('not logged in', function () {

        beforeEach(logout);

        beforeEach(function (done) {
          return browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
            .then(done, done);
        });

        it('should suggest logging in or signing up with proper redirect in link', function () {
          var redirect = '/login?redirect=%2Fchallenge%2F' + existentChallenge.id + '%2F' + existentChallenge.url;
          browser.assert.success();
          browser.assert.text('div.popup-message.info', 'log in or sign up to read more and contribute');
          browser.assert.link('div.popup-message.info a', 'log in', redirect);
          browser.assert.link('div.popup-message.info a', 'sign up', '/signup');
          browser.assert.attribute('#login-form', 'action', redirect);
        });
      });

      context('logged in', function () {
        beforeEach(login);

        beforeEach(function (done) {
          browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
            .then(done, done);
        });

        afterEach(logout);

        //challenge/id/name/add-tag
        it('may be possible to remove tags which user added and have 0 or negative voting');
        it('should show the tags to be votable (whether the tag is fitting or not)');
        

        it('should show buttons for launching idea, project, discussion, challenge...');
        it('may make it possible to link existent ideas, projects, discussions, challenges');
        it('may be possible to edit the challenge name and description in wikipedia or etherpad style');

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
            return dbChallenge.follow(existentChallenge.id, 'test1')
              .then(function (_out) {
                done();
              }, done);
          });

          beforeEach(function (done) {
            browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
              .then(done, done);
          });

          afterEach(function (done) {
            return dbChallenge.unfollow(existentChallenge.id, 'test1')
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

        context('user doesn\'t hide the challenge', function () {
          it('should show a hide button', function () {
            browser.assert.element('#hide-form');
            browser.assert.attribute('#hide-form', 'method', 'post');
            browser.assert.element('#hide-form input[type=submit]');
            browser.assert.attribute('#hide-form input[type=submit]', 'name', 'submit');
            browser.assert.attribute('#hide-form input[type=submit]', 'value', 'hide');
          });
        });

        context('user hides the challenge', function () {
          beforeEach(function (done) {
            return dbChallenge.hide(existentChallenge.id, 'test1')
              .then(function (_out) {
                done();
              }, done);
          });

          beforeEach(function (done) {
            browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
              .then(done, done);
          });

          afterEach(function (done) {
            return dbChallenge.unhide(existentChallenge.id, 'test1')
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

        context('user is creator', function () {
          it('may be possible to delete the challenge if not embraced'); //challenge/id/name/delete //discourage!
          it('may be possible for the creator to remove their name (anonymization)');
          it('may edit the challenge name');
          it('may edit the challenge description');
        });
        
        context('user is not a creator', function () {});
      });
    });

    context('POST', function () {
      context('logged in', function () {

        beforeEach(login);

        beforeEach(function (done) {
          browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
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
            return dbChallenge.unfollow(existentChallenge.id, loggedUser.username)
              .then(function () {done();}, done );
          });
          
          it('should make user follow the challenge and update the button to unfollow', function () {
            browser.assert.success();
            browser.assert.element('#unfollow-form');
          });

          it('should display info that user now follows the challenge', function () {
            browser.assert.text('div.popup-message.info', new RegExp('Now you follow the challenge\\.'));
          });
        });

        context('unfollow', function () {
          beforeEach(function (done) {
            return dbChallenge.follow(existentChallenge.id, 'test1')
              .then(function (_out) {
                done();
              }, done);
          });

          beforeEach(function (done) {
            browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
              .then(done, done);
          });

          beforeEach(pressJustAButton('unfollow'));

          afterEach(function (done) {
            return dbChallenge.unfollow(existentChallenge.id, 'test1')
              .then(null, function (err) {
                if(err.message !== '404') {
                  throw err;
                }
              })
              .then(function (_out) {
                done();
              }, done);
          });

          it('should make user unfollow the challenge and update the button to follow', function () {
            browser.assert.success();
            browser.assert.element('#follow-form');
          });

          it('should display info that user now follows the challenge', function () {
            browser.assert.text('div.popup-message.info', new RegExp('You don\'t follow the challenge anymore\\.'));
          });
        });

        context('hide', function () {
          beforeEach(pressJustAButton('hide'));

          afterEach(function (done) {
            return dbChallenge.unhide(existentChallenge.id, loggedUser.username)
              .then(function () {done();}, done );
          });
          
          it('should make the challenge hidden and update the button to unhide', function (){
            browser.assert.success();
            browser.assert.element('#unhide-form');
          });

          it('should display info that the challenge won\'t be shown in searches', function (){
            browser.assert.text('div.popup-message.info', new RegExp('The challenge won\'t be shown in your search results anymore\\.'));
          });
        });

        context('unhide', function () {
          beforeEach(function (done) {
            return dbChallenge.hide(existentChallenge.id, loggedUser.username)
              .then(function (_out) {
                done();
              }, done);
          });

          beforeEach(function (done) {
            browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
              .then(done, done);
          });

          beforeEach(pressJustAButton('unhide'));

          afterEach(function (done) {
            return dbChallenge.unfollow(existentChallenge.id, 'test1')
              .then(null, function (err) {
                if(err.message !== '404') {
                  throw err;
                }
              })
              .then(function (_out) {
                done();
              }, done);
          });

          it('should unhide the challenge and update the button to hide', function (){
            browser.assert.success();
            browser.assert.element('#hide-form');
          });

          it('should display info that the challenge will be shown in searches again', function (){
            browser.assert.text('div.popup-message.info', new RegExp('The challenge will be shown in your search results again\\.'));
          });
        });
      });
      context('not logged in', function () {
        //i'm not able to write this test: i.e. fill the form and then logout and then post it. but it should work.
        /*
        beforeEach(login)
        beforeEach(logout);

        beforeEach(function (done) {
          browser.visit('/challenge/' + existentChallenge.id + '/' + existentChallenge.url)
            .then(done, done);
        });

        afterEach(logout);
        */
        it('should show error that user needs to log in to perform any editing'/*, function () {
          let redirect = '/login?redirect=%2Fchallenge%2F' + existentChallenge.id + '%2F' + existentChallenge.url;
          browser.assert.text('div.popup-message.info', new RegExp('You need to log in to POST anything.'));
          browser.assert.link('div.popup-message.info a', 'log in', redirect);
        }*/);
      });
    });
  });

  context('challenge with :id doesn\'t exist', function () {
    it('should show 404 error page');
  });
});
