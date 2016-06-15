'use strict';

// force the test environment to 'test'
process.env.NODE_ENV = 'development';

//dependencies
var config = require('../partial/config');
var dbConfig = require('../../../services/db-config');//but the app is running on different required db-config!!
var dbData = require('./dbDataProjectJoin');

//set the testing environment
var deps = config.init({db: dbConfig}, dbData);


//run the tests

//


describe('joining a project', function () {
  let browserObj = {};
  let functions = deps.functions;

  let users = {
    none: dbData.users[0],
    joining: dbData.users[1],
    invited: dbData.users[2],
    member: dbData.users[3]
  }

  let project0 = dbData.projects[0];
  let project1 = dbData.projects[1];

  config.beforeTest(browserObj, deps);
  context('logged', function () {
    context('user has no relation', function () {
      //login
      beforeEach(functions.login(dbData.users[0], browserObj));
      afterEach(functions.logout(browserObj)); //logout

      context('visit project page', function () {
        beforeEach(functions.visit(() => { return '/project/' + dbData.projects[0].id; }, browserObj));
        it('should contain a join button', function () {
          let browser = browserObj.Value;
          browser.assert.success();
          browser.assert.link('a', 'join', new RegExp('/project/' + dbData.projects[0].id + '.*/join'));
        });
      });

      context('visit /project/.../join', function () {
        beforeEach(functions.visit(() => { return '/project/' + dbData.projects[0].id + '/' + dbData.projects[0].url + 'aa/join'; }, browserObj));
        it('should show a join page', function () {
          let browser = browserObj.Value;
          browser.assert.success();
        });
        
        context('join info filled', function () {
          it('should show join info', function () {
            let browser = browserObj.Value;
            browser.assert.element('.join-info');
            browser.assert.text('.join-info', project0.join_info);
          });
        });

        context('join info empty', function () {
          it('should show default join info', function () {
            throw new Error('todo');
          });
        });
      });
    });
    context('joining', function () {});
    context('invited', function () {});
    context('member', function () {});
  });
  context('not logged', function () {});
});
