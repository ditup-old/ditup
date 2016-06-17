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
      beforeEach(functions.login(users.none, browserObj));
      afterEach(functions.logout(browserObj)); //logout

      context('visit project page', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id; }, browserObj));
        it('should contain a join button', function () {
          let browser = browserObj.Value;
          browser.assert.success();
          browser.assert.link('a', 'join', new RegExp('/project/' + project0.id + '.*/join'));
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
          beforeEach(functions.visit(() => { return '/project/' + project1.id + '/' + project1.url + '/join'; }, browserObj));
          it('should show default join info', function () {
            let browser = browserObj.Value;
            browser.assert.success();
            browser.assert.text('.join-info', 'default join info text');
          });
        });

        it('should show a form to fill the request', function () {
          let browser = browserObj.Value;
          //form
          browser.assert.element('form.join-request');
          browser.assert.attribute('form.join-request', 'method', 'post');
          //textarea
          browser.assert.element('.join-request textarea[name=request-text]');
          //join button
          browser.assert.element('.join-request input[type=submit][name=join][value]');
          //cancel link
          browser.assert.link('.join-request a.cancel-join', 'Cancel', '/project/' + project0.id + '/' + project0.name);
        });
      });
    });

    context('joining', function () {
      beforeEach(functions.login(users.joining, browserObj));
      afterEach(functions.logout(browserObj));

      context('/project', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id; }, browserObj));
        it('should show \'edit join\' button', function () {
          let browser = browserObj.Value;
          browser.assert.success();
          browser.assert.link('a', 'edit join', new RegExp('/project/' + project0.id + '.*/join'));
        });
      });

      context('/project/.../join', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));

        it('should show join message', function () {
          let browser = browserObj.Value;
          browser.assert.element('.join-info');
          browser.assert.text('.join-info', project0.join_info);
        });

        it('should show a form & textarea with join request', function () {
          let browser = browserObj.Value;
          browser.assert.element('form.join-request');
          browser.assert.attribute('form.join-request', 'method', 'post');
          //textarea
          browser.assert.element('.join-request textarea[name=request-text]');
          //join button
          browser.assert.input('.join-request textarea[name=request-text]', dbData.projectMember[0].request);
        });

        it('should offer editing join request', function () {
          let browser = browserObj.Value;
          //edit request button
          browser.assert.element('.join-request input[type=submit][name=submit][value="Edit request"]');
        });

        it('should offer deleting join request', function () {
          let browser = browserObj.Value;
          //delete request button
          browser.assert.element('.join-request input[type=submit][name=submit][value="Delete request"]');
        });

        it('should offer cancel of this action', function () {
          let browser = browserObj.Value;
          //cancel link
          browser.assert.link('.join-request a.cancel-join', 'Cancel', '/project/' + project0.id + '/' + project0.name);
        });
      });
    });

    context('invited', function () {
      beforeEach(functions.login(users.invited, browserObj));
      afterEach(functions.logout(browserObj));

      context('/project', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id; }, browserObj));

        it('should show \'accept or reject invite\' button', function () {
          let browser = browserObj.Value;
          browser.assert.success();
          browser.assert.link('a', 'invited', new RegExp('/project/' + project0.id + '.*/join'));
        });

        it('should show \'~you were invited to join the project\' message', function () {
          let browser = browserObj.Value;
          browser.assert.text('.popup-message.info', new RegExp('.*you were invited to join the project.*'));
        });
      });
      context('/project/.../join', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));

        it('should say that user is invited and can just accept or reject the invite', function () {
          let browser = browserObj.Value;
          browser.assert.text('.join-info', 'You were invited to become a member of this project. You can accept or reject the invitation below.');
        });
        it('should offer accept button', function () {
          let browser = browserObj.Value;
          browser.assert.element('.process-invitation input[type=submit][name=submit][value="Accept invitation"]');
        });
        it('should offer reject button', function () {
          let browser = browserObj.Value;
          browser.assert.element('.process-invitation input[type=submit][name=submit][value="Reject invitation"]');
        });
        it('should offer cancel the action', function () {
          let browser = browserObj.Value;
          browser.assert.link('.process-invitation a.cancel-join', 'Cancel', '/project/' + project0.id + '/' + project0.name);
        });
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
