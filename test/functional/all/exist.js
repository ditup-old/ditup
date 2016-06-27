'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module

var co = require('co');

var app = require('../../../app');
var session = require('../../../session');

var Database = require('arangojs');
var config = require('../../../services/db-config');
var db = new Database({url: config.url, databaseName: config.dbname});
var dbData = require('../../dbData');
var dbPopulate = require('../../dbPopulate')(db);
var testConfig = require('../partial/config');
var funcs = testConfig.funcs;

// use zombie.js as headless browser
var Browser = require('zombie');
describe('visiting urls of basic objects', function () {
  var server, browser, browserObj = {};
  
  before(function () {
    server = app(session).listen(3000);
    browser = new Browser({ site: 'http://localhost:3000' });
    browserObj.Value = browser;
  });

  after(function (done) {
    server.close(done);
  });

//***********populating the database
  before(function (done) {
    dbPopulate.clear()
      .then(done, done);
  });

  beforeEach(function (done) {
    dbPopulate.populate(dbData)
      .then(done, done);
  });

  afterEach(function (done) {
    dbPopulate.clear()
      .then(done, done);
  });
//***********END

  var basics = ['idea', 'project', 'discussion', 'challenge'];
  for(let bs of basics) {
    context(bs, function () {
      it('visit of ' + bs + 's should be successful', function (done) {
        return browser.visit('/' + bs + 's')
          .then(function () {
            return browser.assert.success();
          })
          .then(done, done);
      });

      it('visit of ' + bs + 's/new should be successful', function (done) {
        return browser.visit('/' + bs + 's/new')
          .then(function () {
            return browser.assert.success();
          })
          .then(done, done);
      });

      it('visit of ' + bs + '/:id/:url should be successful', function (done) {
        let bss = bs+'s';
        //console.log(dbData);
        return browser.visit('/' + bs + '/'+ dbData[bss][0].id + '/' + dbData[bss][0].url)
          .then(function () {
            return browser.assert.success();
          })
          .then(done, done);
      });
    });
  }

  it('visit of /about should be successful', function (done) {
    co(function *() {
      yield browser.visit('/about');
      browser.assert.success();
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });
  it('visit of /people should be successful', function (done) {
    co(function *() {
      yield browser.visit('/people');
      browser.assert.success();
      done();
    })
    .catch(function (err) {
      done(err);
    });
  });
  
  context('logged in', function () {
    beforeEach(funcs.logout(browserObj));
    beforeEach(funcs.login(dbData.users[0], browserObj));
    afterEach(funcs.logout(browserObj));
    it('visit of /messages should be successful', function (done) {
      co(function *() {
        yield browser.visit('/messages');
        browser.assert.success();
        done();
      })
      .catch(function (err) {
        done(err);
      });
    });
  });
});
