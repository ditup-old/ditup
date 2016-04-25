'use strict';

module.exports = function (browser) {
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
  return {
    login: login,
    logout: logout
  }
};
