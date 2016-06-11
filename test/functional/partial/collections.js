'use strict';

module.exports = function (collection, dbData, dependencies, settings) {
  //  dependencies: app, session, data, generateUrl, Browser

  //using this module, you need to close server manually.
  //***************BEGIN USAGE
  let usage = `
  module exports function (collection, dbData, dependencies, settings);
  collection is name of collection in singular;
  dbData is data already populated in database;
  dependencies: {
    server: {Value: ...}
    browser: {Value: ...}}
    data: collection functions for accessing database (see /services/data/[collection].js)
    functions: {login({username, password}, browser), logout(browser), visit('url', browser)}
  }
  
  `;

  console.log(usage);
  //***************END USAGE

  var settings = settings || {};
  var dbCollection = dependencies.data;
  var logout = dependencies.functions.logout;
  var login = dependencies.functions.login;
  var visit = dependencies.functions.visit;
  var db = dependencies.db;

  let serverObj = dependencies.server;
  let browserObj = dependencies.browser;

  var loggedUser = dbData.users[0];

  function beforeLogged (user) {
    beforeEach(logout(browserObj));
    beforeEach(login(user, browserObj));
    afterEach(logout(browserObj));

    beforeEach(visit('/' + collection + 's', browserObj));
  }

  describe('visit /' + collection + 's', function () {
    var server, browser;
    
    before(function () {
      server = serverObj.Value;
      browser = browserObj.Value;
    });

    beforeEach(visit('/'+collection+'s', browserObj));

    it('should show 5 popular ' + collection + 's', function () {
      browser.assert.element('.popular-list-followers'); //the list is there
      browser.assert.elements('.popular-list-followers .' + collection + '', 5); //there is 5 of them
      browser.assert.text('.popular-list-followers .' + collection + ' .' + collection + '-name', '' + collection + '3' + collection + '5' + collection + '4' + collection + '6' + collection + '7'); //the names of collections are displayed
      browser.assert.link('.popular-list-followers a', '' + collection + '3', new RegExp('/' + collection + '/'+dbData[collection+'s'][3].id+'.*')); //links to collection pages
      browser.assert.text('.popular-list-followers li:first-child .followerno', '5 followers');
    });
    it('should show 5 new ' + collection + 's', function () {
      browser.assert.element('.new-list'); //the list is there
      browser.assert.elements('.new-list .' + collection + '', 5); //there is 5 of them
      browser.assert.link('.new-list a', '' + collection + '7', new RegExp('/' + collection + '/'+dbData[collection+'s'][7].id+'.*')); //links to collection pages
      browser.assert.elements('.' + collection + ' .created', 5);
    });
    it('should show 1 random ' + collection + '', function () {
      browser.assert.element('.random-list'); //the list is there
      browser.assert.elements('.random-list .' + collection + '', 1); //there is 5 of them
    });
    it('should show 5 recently active ' + collection + 's');
    
    context('logged', function () {
      let loggedUser = dbData.users[0];

      beforeLogged(loggedUser);

      it('should show create new ' + collection + ' button', function () {
        browser.assert.element('.create-new-' + collection + '');
        browser.assert.link('.create-new-' + collection + '', 'Create a new ' + collection + '', '/' + collection + 's/new');
      });
    });
    context('not logged', function () {
      beforeEach(logout(browserObj));
      beforeEach(visit('/' + collection + 's', browserObj));

      it('not show create-new-' + collection + ' button', function () {
        browser.assert.elements('.create-new-' + collection + '', 0);
      });
    });
  });
};

/*
'use strict';

describe('user visits /challenges', function () {
  it('should show new challenges');
  it('should show random challenge');
  it('should show popular challenges');
  it('may show some activity feed');
  it('may have a search field');
  context('user (logged in)', function () {
    it('should show a \'create new challenge\' link');
    it('should show challenges of interest (by common tags)')
  });
  context('visitor (not logged in)', function () {
    it('should not show a \'create new challenge\' link');
    it('should suggest logging in to create a new challenge and view more');
  });
});
*/
