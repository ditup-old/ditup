'use strict';

//testing the page /user/:username/page
//
//
module.exports = function (page) {
  let config = require('../partial/config');
  let dbConfig = require('../../../services/db-config');
  let dbData = require('./dbPages');
  
  let sg = page.slice(-1) === 's' ? page.slice(0,-1) : page;
  let Sg = sg.slice(0,1).toUpperCase() + sg.slice(1);
  let Page = page.slice(-1) === 's' ? Sg+'s' : Sg;

  let deps = config.init({db: dbConfig}, dbData);
  let funcs = config.funcs;

  describe(`visit /user/:username/${page}`, function () {
    let browserObj = {};
    let browser;

    let loggedUser = dbData.users[0];
    let otherUser = dbData.users[1];

    config.beforeTest(browserObj, deps);

    beforeEach(function () {
      browser = browserObj.Value;
    });

    context('logged in', function () {
      beforeEach(funcs.login(loggedUser, browserObj));
      afterEach(funcs.logout(browserObj));
      beforeEach(funcs.visit(`/user/${otherUser.username}/${page}`, browserObj));

      //every second user follows the otherUser
      //every third user is followed by the otherUser
      let userno = dbData.users.length;
      let followerno = Math.ceil(userno / 2);
      let followingno = Math.ceil(userno / 3);

      let elementno = 0;
      switch (page) {
        case 'followers':
          elementno = followerno;
          break;
        case 'following':
          elementno = followingno;
          break;
        default:
          throw new Error('tested page type not found');
      }

      it(`should show a header: ${Page}`, function () {
        browser.assert.text(`.user-${page}-header`, `${Page}`);
      });
      it(`should show a list of ${page} of the user`, function () {
        browser.assert.element(`.user-${page}-list`);
        browser.assert.elements(`.user-${sg}`, elementno);
      });
    });

    context('not logged in', function () {
      it('should show 403 Not Authorized page', funcs.testError(`/user/${otherUser.username}/${page}`, 403, browserObj));
    });
  });
}
