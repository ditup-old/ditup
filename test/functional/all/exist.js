'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';
// get the application server module
var app = require('../../../app');
var session = require('../../../session');

// use zombie.js as headless browser
var Browser = require('zombie');
describe('visiting urls of basic objects', function () {
  var server, browser;
  
  before(function () {
    server = app(session).listen(3000);
    browser = new Browser({ site: 'http://localhost:3000' });
  });

  after(function (done) {
    server.close(done);
  });

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
    });
  }
});
