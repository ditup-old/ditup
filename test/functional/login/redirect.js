'use strict';
let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
var dbData = require('./dbRedirect');
let generateUrl = require('../../../routes/collection/functions').generateUrl;
var testCollections = require('../partial/collections');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

/*describe('visiting /ideas', function () {
*/

describe('when logging in by header link, we get always redirected to the same page', function () {
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  let loggedUser = dbData.users[0];


  let urls = ['/projects', '/challenges', '/people', '/people?active=true'];

  context('user is not logged in', function () {
    beforeEach(funcs.logout(browserObj));
    function testUrl(url) {
      context(`clicking login link in header and logging in to ${url}`, function () {
        //visiting the url
        beforeEach(funcs.visit(url, browserObj));
        beforeEach(function (done) {
          co(function *() {
            yield browser.clickLink('login')
            yield browser
              .fill('username', loggedUser.username)
              .fill('password', loggedUser.password)
              .pressButton('login');
            done();
          }).catch(done);
        });
        it(`should redirect back to ${url}`, function () {
          browser.assert.url(url);
        });
      });
    }

    for(let url of urls) {
      testUrl(url);
    }
  });
});
