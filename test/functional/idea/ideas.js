'use strict';

let config = require('../partial/config');
let dbConfig = require('../../../services/db-config');
var dbData = require('./dbDataIdeas');
let generateUrl = require('../../../routes/collection/functions').generateUrl;
var testCollections = require('../partial/collections');

let deps = config.init({db: dbConfig}, dbData);
let funcs = config.funcs;
let co = require('co');

describe('visiting /ideas', function () {
  let browserObj = {};
  let browser;

  config.beforeTest(browserObj, deps);

  beforeEach(function () {
    browser = browserObj.Value;
  });

  let loggedUser = dbData.users[0];

  //***********tests
  console.log(deps);
  let dependencies = {
    browser: browserObj,
    functions: funcs,
  };


  testCollections('idea', dbData, dependencies);

});
