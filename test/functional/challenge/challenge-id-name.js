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

// use zombie.js as headless browser
var Browser = require('zombie');
describe('visit /challenge/:id/:name', function () {
  var server, browser;
  
  before(function () {
    server = app(session).listen(3000);
    browser = new Browser({ site: 'http://localhost:3000' });
  });

  after(function (done) {
    server.close(done);
  });

  function login (done) {
    browser.visit('/login')
      .then(() => {
        return browser.fill('username', 'test1')
          .fill('password', 'asdfasdf')
          .pressButton('log in');
      })
      .then(done, done);
  }

  function logout (done) {
    browser.visit('/logout')
      .then(done, done);
  }
  
  var existentChallenge = {name: 'new test challenge', description: 'some description', id: undefined, tags: ['test-tag-3', 'test-tag-1']};
  var nonexistentChallenge = {name: 'nonexistent challenge', description: 'some description', id: '1234567890'};
  existentChallenge.url = generateUrl(existentChallenge.name);
  nonexistentChallenge.url = generateUrl(nonexistentChallenge.name);

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
      it('should show tags', function () {
        for(var i = existentChallenge.tags.length-1; i>=0; i--){
          browser.assert.text('#challenge-tags', new RegExp(existentChallenge.tags[i]));
        }
      });
      it('should show followers');
      it('should show stars')
      it('should show the challenges, tags, followers, stars, etc.');
      it('should show link for sharing the challenge', function () {
        browser.assert.input('#challenge-url', browser.url);
        //browser.assert.input('#challenge-url-short', 'http://localhost:3000/c/'+existentChallenge.id);
        //TODO!!! check how it works in html on i.e. github...
      });
      it('should show social networking links for sharing');
      /**how does social networking work???*/

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
        it('should show a field for adding a comment to challenge');
        it('should show links to reacting to comments');
        it('should show buttons for launching idea, project, discussion, challenge...');
        it('may make it possible to link existent ideas, projects, discussions, challenges');
        it('may be possible to edit the challenge name and description in wikipedia or etherpad style');

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
            return dbChallenge.removeTag(existentChallenge.id, tagToAdd)
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
        context('adding a comment', function () {
          it('should add the comment and show it');
          it('should display info that the comment was successfully added');
        });
        context('follow', function () {
          it('should make user follow the challenge and update the button to unfollow');
        });
        context('unfollow', function () {
          it('should make user unfollow the challenge and update the button to follow');
        });
      });
      context('not logged in', function () {
        it('should show error that user needs to log in to perform any editing');
      });
    });
  });

  context('challenge with :id doesn\'t exist', function () {
    it('should show 404 error page');
  });
});
