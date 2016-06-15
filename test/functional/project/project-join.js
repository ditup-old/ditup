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
        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));
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
          beforeEach(functions.visit(() => { return '/project/' + dbData.projects[1].id + '/' + dbData.projects[1].url + '/join'; }, browserObj));
          it('should show default join info', function () {
            let browser = browserObj.Value;
            browser.assert.success();
            browser.assert.text('.join-info', 'default join info text');
          });
        });
      });
    });

    context('joining', function () {
      context('/project', function () {
        it('should show \'edit join\' button');
      });

      context('/project/.../join', function () {
        it('should show join message');
        it('should offer editing join request');
        it('should offer deleting join request');
        it('should offer cancel of this action');
      });
    });
    context('invited', function () {
      context('/project', function () {
        it('should show \'accept or reject invite\' button');
        it('should show \'~you were invited to join the project\' message');
      });
      context('/project/.../join', function () {
        it('should say that user is invited and can just accept or reject the invite');
        it('should offer accept button');
        it('should offer reject button');
        it('should offer cancel the action');
      });
    });
    context('member', function () {
      context('/project', function () {
        it('show Member button');
      });
      context('/project/../join', function () {
        it('say user is member and can edit the join info');
        it('offer submit/cancel');
        it('offer link to managing joiners (invite, accept, reject)');
        it('offer link to leave the project');
      });
    });
  });
  context('not logged', function () {
    it('should ask user to log in (with proper redirect)');
  });
});
