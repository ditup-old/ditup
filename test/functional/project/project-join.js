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
    member: dbData.users[3],
    otherMember: dbData.users[4]
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
  
  /*
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
  */
  context('logged', function () {
    //*
    context('POST', function () {
      /*
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
      // */
      /*
      context('[member] edit join info', function () {
        it('should update the join info');
        it('should display the new join info');
        it('should say that info was updated');
      });
      // */
      /*
      context('[member] add joiner', function () {
        //how shall we do it?
        //there needs to be a list of people who are joining
        //login
        beforeEach(functions.login(users.member, browserObj));
        //add joiner
        beforeEach(functions.fill(() => { 
          return `/project/${project0.id}/${project0.url}/join?user=${users.joining.username}`;
        },{submit: 'accept'} , browserObj));
        //run the test
        afterEach(functions.logout(browserObj));
        context('.', function () {
          //logout
          beforeEach(functions.logout(browserObj));
          //login as the joiner
          beforeEach(functions.login(users.joining, browserObj));
          //go to project page
          beforeEach(functions.visit(() => `/project/${project0.id}/${project0.url}`, browserObj));

          it('should make user>member in db', function () {
            assertMemberLink();
          });
        }) 
        it('should display info that user ... is member now', function () {
          browser.assert.text('.popup-message', `user ${users.joining.username} is member now`);
        });
        it('should give the new member a notification');
      });
      // */
      /*
      context('[member] reject joiner', function () {
        //login
        beforeEach(functions.login(users.member, browserObj));
        //add joiner
        beforeEach(functions.fill(() => { 
          return `/project/${project0.id}/${project0.url}/join?user=${users.joining.username}`;
        },{submit: 'reject'} , browserObj));
        //run the test
        afterEach(functions.logout(browserObj));
        context('.', function () {
          //logout
          beforeEach(functions.logout(browserObj));
          //login as the joiner
          beforeEach(functions.login(users.joining, browserObj));
          //go to project page
          beforeEach(functions.visit(() => `/project/${project0.id}/${project0.url}`, browserObj));

          it('should remove joining from database', function () {
            assertNoneLink();
          });
        }) 
        it('should display info that user ... was rejected', function () {
          browser.assert.text('.popup-message', `user ${users.joining.username} was rejected`);
        });

        context('.', function () {
          //logout
          beforeEach(functions.logout(browserObj));
          //login as the joiner
          beforeEach(functions.login(users.joining, browserObj));
          //go to project page
          beforeEach(functions.visit('/notifications', browserObj));
        
          it('should give the rejected user a notification', function () {
            browser.assert.text('.notification', 'you were not accepted to a project');
          });
        });
      });
      // */
      /*
      context('[member] invite user [no relation]', function () {
        beforeEach(functions.login(users.member, browserObj));
        //add joiner
        beforeEach(functions.fill(() => { 
          return `/project/${project0.id}/${project0.url}/join?user=${users.none.username}`;
        },{submit: 'invite'} , browserObj));
        //run the test
        afterEach(functions.logout(browserObj));
        context('.', function () {
          //logout
          beforeEach(functions.logout(browserObj));
          //login as the joiner
          beforeEach(functions.login(users.none, browserObj));
          //go to project page
          beforeEach(functions.visit(() => `/project/${project0.id}/${project0.url}`, browserObj));
          it('should add invitation for user to db', function () {
            assertInvitedLink();
          });
        });

        it('should say that invitation was sent', function () {
          browser.assert.text('.popup-message', 'the invitation was sent');
        });
      });

      context('[member] update invitation [invited]', function () {
        let updatedInvitation = 'your invitation is updated, this is the new text';

        beforeEach(functions.login(users.member, browserObj));
        beforeEach(functions.fill(() => { 
          return `/project/${project0.id}/${project0.url}/join?user=${users.invited.username}`;
        }, {invitation: updatedInvitation, submit: 'update invitation'} , browserObj));
        afterEach(functions.logout(browserObj));

        context('.', function () {
          //logout
          beforeEach(functions.logout(browserObj));
          //login as the joiner
          beforeEach(functions.login(users.invited, browserObj));
          //go to project page
          beforeEach(functions.visit(() => `/project/${project0.id}/${project0.url}`, browserObj));
          it('TODO! should update invitation for user in db');
        });

        it('should say invitation was updated', function () {
          browser.assert.text('.popup-message', 'the invitation was updated');
        });
      });

      context('[member] cancel invitation [invited]', function () {
        beforeEach(functions.login(users.member, browserObj));
        beforeEach(functions.fill(() => { 
          return `/project/${project0.id}/${project0.url}/join?user=${users.invited.username}`;
        }, {submit: 'remove invitation'} , browserObj));
        afterEach(functions.logout(browserObj));

        context('.', function () {
          //logout
          beforeEach(functions.logout(browserObj));
          //login as the joiner
          beforeEach(functions.login(users.invited, browserObj));
          //go to project page
          beforeEach(functions.visit(() => `/project/${project0.id}/${project0.url}`, browserObj));
          it('should remove invitation for user from db', function () {
            assertNoneLink();
          });
        });

        it('should say invitation was removed', function () {
          browser.assert.text('.popup-message', 'the invitation was removed');
        });
      });
      // */

      context('all the other options', function () {
        it('should show error not authorized (or some other one?)');
      });
    });

  // */
    /*

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
  // */
    /*

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
  // */
    //*
    context('invited', function () {
      beforeEach(functions.login(users.invited, browserObj));
      afterEach(functions.logout(browserObj));

      context('/project', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id; }, browserObj));

        it('should show \'accept or reject invite\' button', function () {
          browser.assert.success();
          assertInvitedLink();
        });

        it('should show \'you were invited to join the project\' message', function () {
          browser.assert.text('.popup-message.info', new RegExp('.*you were invited to join the project.*'));
        });
      });
      context('/project/.../join', function () {
        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));

        it('should say that user is invited and can just accept or reject the invite', function () {
          browser.assert.text('.join-info', 'You were invited to become a member of this project. You can accept or reject the invitation below.');
        });
        it('should show the invitation message', function () {
          browser.assert.text('.invitation', dbData.projectMember[1].invitation);
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
  // */
  
  /*
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
        //counting how many users are joining project0
        let joiners = [];
        for(let pm of dbData.projectMember) {
          if(pm.status === 'joining' && pm.collection === 0) joiners.push(pm);
        }
        let joinerno = joiners.length;

        beforeEach(functions.visit(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, browserObj));
        it('say user is member and can edit the join info');
        it('offer submit/cancel');
        it('should show list of people who want to join', function () {
          browser.assert.element('.joiners-list');
        });
        it('should show the people who want to join', function () {
          browser.assert.elements('.joiner', joinerno);
        });
        it('should show link to process joining of a user', function () {
          browser.assert.input('.joiner input[type=hidden][name="user"]', dbData.users[joiners[0].user].username);
          browser.assert.input('.joiner input[type=submit]', 'manage');
        });

        context('inviting a user', function () {
          it('should show inviting user form', function () {
            browser.assert.attribute('.invite-form', 'method', 'get');
            browser.assert.input('.invite-form input[type=text][name=user]', '');
            browser.assert.input('.invite-form input[type=submit][name=action]', 'invite');
          });

          context('filling username and clicking invite', function () {
            context('user has no involvement', function () {
              beforeEach(functions.fill(() => `/project/${project0.id}/${project0.url}/join`, {user:users.none.username, submit: 'invite'}, browserObj));

              it('show the invitation form', function () {
                browser.assert.element('.create-invitation-form');
                browser.assert.attribute('.create-invitation-form textarea', 'name', 'invitation');
              });
              it('show send invitation button', function () {
                browser.assert.input('.create-invitation-form input[type=submit]', 'invite');
              });
              it('show cancel button', function () {
                browser.assert.link('.create-invitation-form a', 'cancel', `/project/${project0.id}/${project0.url}/join`);
              });
            });

            context('user is joining', function () {
              beforeEach(functions.fill(() => `/project/${project0.id}/${project0.url}/join`, {user:users.joining.username, submit: 'invite'}, browserObj));
              manageJoinerTests();
            });
            context('user is invited', function () {
              let invitationText = dbData.projectMember[1].invitation;
              beforeEach(functions.fill(() => `/project/${project0.id}/${project0.url}/join`, {user:users.invited.username, submit: 'invite'}, browserObj));

              it('show the invitation form filled with invitation info', function () {
                browser.assert.element('.update-invitation-form');
                browser.assert.attribute('.update-invitation-form textarea', 'name', 'invitation');
                browser.assert.input('.update-invitation-form textarea', invitationText);
              });
              it('show update invitation', function () {
                browser.assert.element('.update-invitation-form input[type=submit][value="update invitation"]');
              });
              it('show remove invitation', function () {
                browser.assert.element('.update-invitation-form input[type=submit][value="remove invitation"]');
              });
              it('show cancel button', function () {
                browser.assert.link('.update-invitation-form a', 'cancel', `/project/${project0.id}/${project0.url}/join`);
              });
            });
            context('user is member', function () {
              beforeEach(functions.fill(() => `/project/${project0.id}/${project0.url}/join`, {user: users.otherMember.username, submit: 'invite'}, browserObj));
              it('show the info that user is already a member => nothing to do', function () {
                browser.assert.text('.info', `${users.otherMember.username} is already a member. You don't need to invite her/him`)              
              });
              it('show `back` button', function () {
                browser.assert.link('a.cancel', 'back', `/project/${project0.id}/${project0.url}/join`);
              });
            });
          });
        });
        it('offer link to leave the project');

        context('click manage joiner', function () {
          beforeEach(functions.fill(() => { return '/project/' + project0.id + '/' + project0.url + '/join'; }, {submit: 'manage'}, browserObj));
          context('user=username is joining', function () {
            manageJoinerTests();
          });
        });

        function manageJoinerTests() {
          it('show the message which user filled when joining', function () {
            browser.assert.text('.join-request', joiners[0].request);
          });
          it('offer accept, reject, link to discussing with the user=username', function () {
            browser.assert.input('input[type=submit][name=accept]', 'accept');
            browser.assert.input('input[type=submit][name=reject]', 'reject');
            browser.assert.link('a', 'talk with joiner', '/messages/'+dbData.users[joiners[0].user].username);
          });
        }
      });
    });
    // */
  });
});

