'use strict';

let config = require('./partial/config');

let dbConfig = require('../../services/db-config');

let dbData = require('../dbData');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;

describe('visit /about', function () {
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  beforeEach(funcs.visit('/about', browserObj));

  it('should be successful', function () {
    browser.assert.success();
  });

  it('should show markdowned test', function () {
    browser.assert.text('.page', new RegExp('.*About.*'));
  });
});
