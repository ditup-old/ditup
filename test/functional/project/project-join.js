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

  let browser;
  beforeEach(function () {
    browser = browserObj.Value;
  });

  function assertMemberLink() {
    browser.assert.link('a', 'member', new RegExp('/project/' + project0.id + '/' + project0.url + '/join'));
  }

  function assertNoneLink() {
    browser.assert.link('a', 'join', new RegExp('/project/' + project0.id + '/' + project0.url + '/join'));
  }

  function assertJoiningLink() {
    browser.assert.link('a', 'edit join', new RegExp('/project/' + project0.id + '/' + project0.url + '/join'));
  }

  function assertInvitedLink() {
    browser.assert.link('a', 'invited', new RegExp('/project/' + project0.id + '/' + project0.url + '/join'));
  }

  context('not logged', function () {
    beforeEach(functions.logout(browserObj));
    beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));
      
    it('should ask user to log in (with proper redirect)', function () {
      browser.assert.success();
      browser.assert.text('.popup-message.info', new RegExp('.*you need to log in before joining the project.*'));
      browser.assert.text('.popup-message.info a', 'log in');
      browser.assert.attribute('.popup-message.info a', 'href', /\/login\?redirect=%2Fproject%2F.*%2Fjoin/);
    });
  });
  context('logged', function () {
    context('POST', function () {
      context('[no relation] new join request', function () {
        beforeEach(functions.logout(browserObj)); //logout
        beforeEach(functions.login(users.none, browserObj));
        beforeEach(functions.fill(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; },{'request-text': 'this is a testing request', submit: 'join'}, browserObj));
        afterEach(functions.logout(browserObj)); //logout
        it('should add the user to database as joining', function (done) {
          browser.assert.success(); //how else can we test this?
          return browser.visit('/project/'+project0.id+'/'+project0.url + '/join')
            .then(function () {
              return browser.assert.input('[name=request-text]', 'this is a testing request');
            })
            .then(done, done);
        });

        it('should redirect to the project page with proper button', function () {
          browser.assert.redirected();
          browser.assert.success();
          assertJoiningLink();
        });

        it('should show the message that request was sent wait for response', function () {
          browser.assert.text('.popup-message.info', 'The request to join the project was sent. You need to wait for a response now.');
        });
        it('should send notification to project members');//
      });
      context('[joining] edit join request', function () {
        beforeEach(functions.logout(browserObj)); //logout
        beforeEach(functions.login(users.joining, browserObj));
        beforeEach(functions.fill(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; },{'request-text': 'this is an updated request', submit: 'Edit request'}, browserObj));
        afterEach(functions.logout(browserObj));
        it('should change the join request in database', function (done) {
          browser.assert.success();
          return browser.visit('/project/'+project0.id+'/'+project0.url + '/join')
            .then(function () {
              return browser.assert.input('[name=request-text]', 'this is an updated request');
            })
            .then(done, done);
        });
        it('should redirect to the project page', function () {
          browser.assert.redirected();
        });
        it('should show the message that request was updated', function () {
          browser.assert.text('.popup-message.info', 'Your request was updated.');
        });
      });
      context('[joining] delete join request', function () {
        beforeEach(functions.logout(browserObj)); //logout
        beforeEach(functions.login(users.joining, browserObj));
        beforeEach(functions.fill(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; },{'request-text': 'this is an updated request', submit: 'Delete request'}, browserObj));
        afterEach(functions.logout(browserObj));
        it('should remove request from database', function () {
          browser.assert.success();
        });

        it('should redirect to project page and display \'join\' button', function () {
          browser.assert.redirected();
          assertNoneLink();
        });
        it('should show the message that request was deleted', function () {
          browser.assert.text('.popup-message.info', 'The request was successfully deleted.');
        });
      });
      context('[invited] accept invitation (become a member)', function () {
        beforeEach(functions.logout(browserObj)); //logout
        beforeEach(functions.login(users.invited, browserObj));
        beforeEach(functions.fill(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; },{submit: 'Accept invitation'}, browserObj));
        afterEach(functions.logout(browserObj));

        it('should update the user to member in the database', function () {
          browser.assert.success();
        });
        it('should redirect to project page for members', function () {
          browser.assert.redirected();
          assertMemberLink();
        });
        it('should say that user is now member', function () {
          browser.assert.text('.popup-message.info', 'You are a member of the project now.');
        });
      });
      context('[invited] reject invitation', function () {
        beforeEach(functions.logout(browserObj)); //logout
        beforeEach(functions.login(users.invited, browserObj));
        beforeEach(functions.fill(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; },{submit: 'Reject invitation'}, browserObj));
        afterEach(functions.logout(browserObj));
        it('should remove the invitation from db', function () {
          browser.assert.success();
        });
        it('should redirect to project page with join button', function () {
          browser.assert.redirected();
          assertNoneLink();
        });
        it('should say that invitation was rejected', function () {
          browser.assert.text('.popup-message.info', 'The invitation was successfully removed.');
        });
      });
      context('[member] edit join info', function () {
        it('should update the join info');
        it('should display the new join info');
        it('should say that info was updated');
      });
      context('[member] add joiner', function () {
        it('should make user>member in db');
        it('should display info that user ... is now member');
        it('should give the new member a notification');
      });
      context('[member] reject joiner', function () {
        it('should remove joining from database');
        it('should display that user ... was rejected');
        it('should give the rejected user a notification');
      });
      context('[member] invite user [no relation]', function () {
        it('should add invite for user to db');
        it('TODO');
      });
      context('[member] cancel invitation [invited]', function () {
        it('TODO');
      });
      context('all the other options', function () {
        it('should show error not authorized (or some other one?)');
      });
    });

    context('user has no relation', function () {
      //login
      beforeEach(functions.logout(browserObj)); //logout
      beforeEach(functions.login(users.none, browserObj));
      afterEach(functions.logout(browserObj)); //logout

      context('visit project page', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id; }, browserObj));
        it('should contain a join button', function () {
          browser.assert.success();
          assertNoneLink();
        });
      });

      context('visit /project/.../join', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));
        it('should show a join page', function () {
          browser.assert.success();
        });
        
        context('join info filled', function () {
          it('should show join info', function () {
            browser.assert.element('.join-info');
            browser.assert.text('.join-info', project0.join_info);
          });
        });

        context('join info empty', function () {
          beforeEach(functions.visit(() => { return '/project/' + project1.id + '/' + project1.url + '/join'; }, browserObj));
          it('should show default join info', function () {
            browser.assert.success();
            browser.assert.text('.join-info', 'default join info text');
          });
        });

        it('should show a form to fill the request', function () {
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
          browser.assert.success();
          assertJoiningLink();
        });
      });

      context('/project/.../join', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));

        it('should show join message', function () {
          browser.assert.element('.join-info');
          browser.assert.text('.join-info', project0.join_info);
        });

        it('should show a form & textarea with join request', function () {
          browser.assert.element('form.join-request');
          browser.assert.attribute('form.join-request', 'method', 'post');
          //textarea
          browser.assert.element('.join-request textarea[name=request-text]');
          //join button
          browser.assert.input('.join-request textarea[name=request-text]', dbData.projectMember[0].request);
        });

        it('should offer editing join request', function () {
          //edit request button
          browser.assert.element('.join-request input[type=submit][name=submit][value="Edit request"]');
        });

        it('should offer deleting join request', function () {
          //delete request button
          browser.assert.element('.join-request input[type=submit][name=submit][value="Delete request"]');
        });

        it('should offer cancel of this action', function () {
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
          browser.assert.success();
          assertInvitedLink();
        });

        it('should show \'~you were invited to join the project\' message', function () {
          browser.assert.text('.popup-message.info', new RegExp('.*you were invited to join the project.*'));
        });
      });
      context('/project/.../join', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));

        it('should say that user is invited and can just accept or reject the invite', function () {
          browser.assert.text('.join-info', 'You were invited to become a member of this project. You can accept or reject the invitation below.');
        });
        it('should offer accept button', function () {
          browser.assert.element('.process-invitation input[type=submit][name=submit][value="Accept invitation"]');
        });
        it('should offer reject button', function () {
          browser.assert.element('.process-invitation input[type=submit][name=submit][value="Reject invitation"]');
        });
        it('should offer cancel the action', function () {
          browser.assert.link('.process-invitation a.cancel-join', 'Cancel', '/project/' + project0.id + '/' + project0.name);
        });
      });
    });
    context('member', function () {
      beforeEach(functions.logout(browserObj)); //logout
      beforeEach(functions.login(users.member, browserObj));
      beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url; }, browserObj));
      afterEach(functions.logout(browserObj));
      context('/project', function () {
        it('show Member button', function () {
          assertMemberLink();
        });
      });
      context('/project/../join', function () {
        it('say user is member and can edit the join info');
        it('offer submit/cancel');
        it('offer link to managing joiners (invite, accept, reject)');
        it('offer link to leave the project');
        // TODO how to manage member-accepting joiners and inviting?
      });
    });
  });
});

