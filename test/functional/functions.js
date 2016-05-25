'use strict';

//these functions are not used anywhere, because they're useless

module.exports = {
  login: login,
  logout: logout
};

function login (browser, user) {
  return function (done) {
    browser.visit('/login')
      .then(() => {
        return browser.fill('username', user.username)
          .fill('password', user.password)
          .pressButton('log in');
      })
      .then(done, done);
  };
}

function logout (browser) {
  return function (done) {
    browser.visit('/logout')
      .then(done, done);
  };
}
