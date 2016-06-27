'use strict';

let co = require('co');

module.exports = {
  init: init,
  beforeTest: beforeTest,
  funcs: {
    login: loginUser,
    logout: logoutUser,
    visit: visit,
    fill: fill
  }
};

function loginUser(user, browserObj) {
  return function login (done) {
    browserObj.Value.visit('/login')
      .then(() => {
        return browserObj.Value.fill('username', user.username)
          .fill('password', user.password)
          .pressButton('log in');
      })
      .then(done, done);
  }
}
  
function logoutUser (browserObj) {
  return function logout (done) {
    let browser = browserObj.Value;
    browser.visit('/logout')
      .then(done, done);
  }
}

function visit (url, browserObj) {
  return function (done) {
    let browser = browserObj.Value;
    let _url;
    if(typeof(url) === 'string') {
      _url = url;
    }
    else if (typeof(url) === 'function') {
      _url = url();
    }
    else {
      throw new Error('url needs to have type function or string, but has '+typeof(url));
    }
    browser.visit(_url)
      .then(done, done);
  }
}

function fill(url, data, browserObj) {
  return function (done) {
    let browser = browserObj.Value;

    //get the url
    let _url;
    if(typeof(url) === 'string') {
      _url = url;
    }
    else if (typeof(url) === 'function') {
      _url = url();
    }
    else {
      throw new Error('url needs to have type function or string, but has '+typeof(url));
    }
    //**
    return co(function *(){
      yield browser.visit(_url);
      for(let name in data) {
        if(name !== 'submit') {
          browser.fill(name, data[name]);
        }
      }
      yield browser.pressButton(data['submit'] || 'submit');
      done();
    })
    .catch(function (err) {
      done(err);
    });
  };
}

function init (config, dbData) {
  // force the test environmentV to 'test'
  process.env.NODE_ENV = 'development';
  // get the application server module
  var app = require('../../../app');
  var session = require('../../../session');

  var Database = require('arangojs');
  var db = new Database({url: config.db.url, databaseName: config.db.dbname});

  var generateUrl = require('../../../routes/discussion/functions').generateUrl;

  var dbPopulate = require('../../dbPopulate')(db);
  var collections = require('../../../services/data/collections');

  // use zombie.js as headless browser
  var Browser = require('zombie');

  //**************shared variables & functions: loggedUser, existentProject, nonexistentProject, login(done), logout(done)
  //
  return {
    dbPopulate: dbPopulate,
    app: app,
    session: session,
    collections: collections,
    config: config.db,
    dbData: dbData,
    Browser: Browser,
    functions: {
      login: this.funcs.login,
      logout: this.funcs.logout,
      visit: this.funcs.visit,
      fill: this.funcs.fill
    }
  };
}

function beforeTest(browserObj, dependencies) {

  var server, browser;
  browserObj = browserObj || {};
  var dbPopulate = dependencies.dbPopulate;
  var app = dependencies.app;
  var session = dependencies.session;
  var collections = dependencies.collections;
  var config = dependencies.config;
  var dbData = dependencies.dbData;
  var Browser = dependencies.Browser;
  

  //*********************setting server & browser
  before(function () {
    server = app(session).listen(3000);
    browser = new Browser({ site: 'http://localhost:3000' });
    browserObj.Value = browser;
  });

  after(function (done) {
    server.close(done);
  });
//*******************END*****************

//**************populate database
  before(function (done) {
    dbPopulate.init(collections, config.dbname)
      .then(done, done);
  });

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
  //*******************END*****************
}
