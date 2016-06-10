'use strict';

module.exports = function (collection, dbData, dependencies, settings) {
  //  dependencies: app, session, data, generateUrl, Browser

  //using this module, you need to close server manually.
  //***************BEGIN USAGE
  let usage = `
  module exports function (collection, dbData, dependencies, settings);
  collection is name of collection in singular;
  dbData is data already populated in database;
    presumptions:
    * users[0] has no connection to collection
    * users[1] follows the collection
    * users[2] hides the collection
  dependencies: {
    server: {Value: ...}
    browser: {Value: ...}}
    data: collection functions for accessing database (see /services/data/[collection].js)
    functions: {login({username, password}, browser), logout(browser)}
  }
  
  `;

  console.log(usage);
  //***************END USAGE

  var settings = settings || {};
  var dbCollection = dependencies.data;
  var logout = dependencies.logout;
  var login = dependencies.login;
  var db = dependencies.db;

  let serverObj = dependencies.server;
  let browserObj = dependencies.browser;

  var loggedUser = dbData.users[0];
  var followingUser = dbData.users[1];
  var hiddenUser = dbData.users[2];

  var existentCollection = dbData[collection+'s'][0];

  function beforeLogged (user) {
    beforeEach(logout(browserObj));
    beforeEach(login(user, browserObj));
    afterEach(logout(browserObj));

    beforeEach(function (done) {
      let browser = browserObj.Value;
      browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
        .then(done, done);
    });
  }

  describe('testing follow: visit /' + collection + '/:id/:name', function () {
    var server, browser;
    
    before(function () {
      server = serverObj.Value;
      browser = browserObj.Value;
    });


    context('' + collection + ' with :id exists', function () {
      context(':id and :name are valid', function () {
        beforeEach(function (done) {
          browser.visit('/' + collection + '/' + existentCollection.id + '/' + existentCollection.url)
            .then(done, done);
        });

        it('should show followers');

        context('logged in', function () {
          context('user doesn\'t follow', function () {
            beforeLogged(loggedUser); //takes care of logging as loggedUser and visiting the page;

            it('should show a \'follow\' button', function () {
              browser.assert.element('#follow-form');
              browser.assert.attribute('#follow-form', 'method', 'post');
              browser.assert.element('#follow-form input[type=submit]');
              browser.assert.attribute('#follow-form input[type=submit]', 'name', 'submit');
              browser.assert.attribute('#follow-form input[type=submit]', 'value', 'follow');
            });
          });

          context('user follows', function () {
            beforeLogged(followingUser); //takes care of logging in and visiting the page;

            it('should show an \'unfollow\' button', function () {
              browser.assert.element('#unfollow-form');
              browser.assert.attribute('#unfollow-form', 'method', 'post');
              browser.assert.element('#unfollow-form input[type=submit]');
              browser.assert.attribute('#unfollow-form input[type=submit]', 'name', 'submit');
              browser.assert.attribute('#unfollow-form input[type=submit]', 'value', 'unfollow');
            });
          });

          context('user doesn\'t hide the ' + collection + '', function () {
            beforeLogged(loggedUser); //takes care of logging in and visiting the page and logging out after;

            it('should show a hide button', function () {
              browser.assert.element('#hide-form');
              browser.assert.attribute('#hide-form', 'method', 'post');
              browser.assert.element('#hide-form input[type=submit]');
              browser.assert.attribute('#hide-form input[type=submit]', 'name', 'submit');
              browser.assert.attribute('#hide-form input[type=submit]', 'value', 'hide');
            });
          });

          context('user hides the ' + collection + '', function () {
            beforeLogged(hiddenUser); //takes care of logging in and visiting the page and logging out after;
            
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

          function pressJustAButton(buttonName) {
            return function (done) {
              return browser
                .pressButton(buttonName)
                .then(done, done);
            };
          }

          context('follow', function () {
            beforeLogged(loggedUser);

            beforeEach(pressJustAButton('follow'));
            
            it('should make user follow the ' + collection + ' and update the button to unfollow', function () {
              browser.assert.success();
              browser.assert.element('#unfollow-form');
            });

            it('should display info that user now follows the ' + collection + '', function () {
              browser.assert.text('div.popup-message.info', new RegExp('Now you follow the ' + collection + '\\.'));
            });
          });

          context('unfollow', function () {
            beforeLogged(followingUser);
            beforeEach(pressJustAButton('unfollow'));

            it('should make user unfollow the ' + collection + ' and update the button to follow', function () {
              browser.assert.success();
              browser.assert.element('#follow-form');
            });

            it('should display info that user now follows the ' + collection + '', function () {
              browser.assert.text('div.popup-message.info', new RegExp('You don\'t follow the ' + collection + ' anymore\\.'));
            });
          });

          context('hide', function () {
            beforeLogged(loggedUser);
            beforeEach(pressJustAButton('hide'));
            
            it('should make the ' + collection + ' hidden and update the button to unhide', function (){
              browser.assert.success();
              browser.assert.element('#unhide-form');
            });

            it('should display info that the ' + collection + ' won\'t be shown in searches', function (){
              browser.assert.text('div.popup-message.info', new RegExp('The ' + collection + ' won\'t be shown in your search results anymore\\.'));
            });
          });

          context('unhide', function () {
            beforeLogged(hiddenUser);

            beforeEach(pressJustAButton('unhide'));

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
  });
};
