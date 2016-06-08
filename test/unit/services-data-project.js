'use strict';

var Database = require('arangojs');
//var config = require('../../services/db-config');
var config = require('../db-config');

var chai = require('chai')
var expect = chai.expect;

chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

var db = new Database({url: config.url, databaseName: config.dbname});

var project = require('../../services/data/project')(db);

var dbPopulate = require('../dbPopulate')(db);
var dbData= require('../dbData');
var collections = require('../../services/data/collections');

var projectsUsersTagsData = require('../dbProjectsUsersTagsData');

var completeData = {
  topic: 'project topic',
  creator: 'test1',
  created: Date.now()
};

describe('database/project', function () {

//**************preparing database
  before(function (done) {
    dbPopulate.init(collections, config.dbname)
      .then(done, done);
  });

  beforeEach(function (done) {
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
//************END

  var existentProject = dbData.projects[0];
  var existentUser = dbData.users[0]; //user with no membership
  var joiningUser = dbData.users[1];
  var invitedUser = dbData.users[2];
  var member = dbData.users[3];

  var mixedUser = dbData.users[5];

  var users = {
    invited: invitedUser,
    joining: joiningUser,
    member: member,
    none: existentUser
  };

  describe('projectsByTagsOfUser(username, showHidden)', function () {
    beforeEach(function (done) {
      return dbPopulate.clear()
        .then(function () {
          return dbPopulate.populate(projectsUsersTagsData);
        })
        .then(done, done);
    });

    afterEach(function (done) {
      dbPopulate.clear()
        .then(done, done);
    });

    context('username exists', function () {
      
      let sharingUser = projectsUsersTagsData.users[1];
      context('showHidden === false or undefined', function () {
        it('should resolve with projects sorted by most shared tags', function (done) {
          return project.projectsByTagsOfUser(sharingUser.username)
            .then(function (projects) {
              expect(projects.length).to.equal(2);
              //in data provided there are 3 projects. project0 with 3 tags, project1 with 2, project2 with 1. but project 0 is hidden.
              expect(projects[0].id).to.equal(projectsUsersTagsData.projects[1].id);
              expect(projects[1].id).to.equal(projectsUsersTagsData.projects[2].id);
              expect(projects[0].tags).to.contain.something.that.has.a.property('name', 'tag1');
              expect(projects[0].tags).to.contain.something.that.has.a.property('name', 'tag3');
              expect(projects[1].tags).to.contain.something.that.has.a.property('name', 'tag2');
            })
            .then(done, done);
        });
      });
    });

    context('username not exist', function () {
      it('should reject with error 404', function () {
        return expect(project.projectsByTagsOfUser('non-username')).to.eventually.be.rejectedWith('404');
      });
    });
  });

  describe('membership functions', function () {
    let possibleStatus = ['joining', 'invited', 'member'];
    describe('userProjects', function () {
      context('good status: ([possibleStatus] || all || empty)', function () {
        context('user exists', function () {
          for(let st of [possibleStatus[0], possibleStatus[1], possibleStatus[2]]){
            let u = users[st];

            it('[status: ' + st + '] should be fulfilled', function () {
              return expect(project.userProjects(u.username, st)).to.eventually.be.fulfilled;
            });

            it('[status: '+st+'] should return array of projects which user is '+st, function (done) {
              let proms = [];
              for(let proj of u.projects[st]) {
                proms.push(project.userProjects(u.username, st));
              }
              
              Promise.all(proms)
                .then(function (prs) {
                  for(let i=0, len=u.projects[st].length; i<len; ++i) {
                    expect(prs[i]).to.include.something.that.has.a.property('id', u.projects[st][i].id);
                  } 
                })
                .then(done, done);
            });
          }

          it('[status: all] should be fulfilled', function () {
            return expect(project.userProjects(mixedUser.username, 'all')).to.eventually.be.fulfilled;
          });

          it('[status: all] should return array of projects which user has some status', function (done) {
            project.userProjects(mixedUser.username)
              .then(function (prs) {
                expect(prs.length>0).to.be.true;
                for(let st of possibleStatus) {
                  for(let i=0, len=mixedUser.projects[st].length; i<len; ++i) {//iterating over all expected projects of user.
                    expect(prs).to.include.something.that.has.a.property('id', mixedUser.projects[st][i].id); //check that for 
                    expect(prs).to.include.something.that.has.a.property('status', st); //check that for 
                  }
                }
              })
              .then(done, done);
          });
        });

        context('user doesn\'t exist', function () {
          it('should reject promise with 404', function () {
            return expect(project.userProjects('nonexistent-user', 'member')).to.eventually.be.rejectedWith('404');
          });
        });
      });
      context('bad status: !good status', function () {
        it('should reject promise with 400', function () {
          return expect(project.userProjects(existentUser.username, 'weird-status')).to.eventually.be.rejectedWith('400');
        });
      });
    });


    describe('addMember(id, username, status)', function () {
      context('existent status', function () {
        context('id exists', function () {
          context('username exists', function () {
            context('not any member status yet', function () {
              for(let ps of possibleStatus){
                it('[status: ' + ps + '] should return a promise and fulfill it', function () {
                  return expect(project.addMember(existentProject.id, existentUser.username, ps)).to.eventually.be.fulfilled;
                });
              }
            });

            context('already some member status', function () {
              var alreadyStatus = [
                {user: joiningUser,  status:'joining'},
                {user: invitedUser,  status:'invited'},
                {user: member,  status:'member'}
              ];
              for(let as of alreadyStatus) {
                it('['+as.status+'] should return a promise and reject it with error 409', function () {
                  return expect(project.addMember(existentProject.id, as.user.username, as.status)).to.eventually.be.rejectedWith('409');
                });
              }
            });
          });

          context('username not exist', function () {
            it('should return a promise and reject it with 404', function () {
              return expect(project.addMember(existentProject.id, 'nonexistent-username', 'member')).to.eventually.be.rejectedWith('404');
            });
          });
        });

        context('id doesn\'t exist', function () {
          it('should return a promise and reject it with 404', function () {
            return expect(project.addMember('nonexistent id', existentUser.username, 'member')).to.eventually.be.rejectedWith('404');
          });
        });
      });

      context('bad status', function () {
        it('should return a promise and reject it with error 400', function () {
          return expect(project.addMember(existentProject.id, existentUser.username, 'bad-status')).to.eventually.be.rejectedWith('400');
        });
      });
    });


    describe('updateMember', function () {
      it('TODO');
    });
    describe('removeMember', function () {
      it('TODO');
    });
    describe('isMember', function () {
      it('TODO');
    });
    describe('userStatus(id, username)', function () {
      for(let ps of possibleStatus){
        it('[status: ' + ps + '] should return a promise and fulfill it with '+ps, function () {
          return expect(project.userStatus(existentProject.id, users[ps].username)).to.eventually.equal(ps);
        });
      }
      it('[status: none] should return a promise and fulfill it with empty string', function () {
        return expect(project.userStatus(existentProject.id, users['none'].username)).to.eventually.equal('');
      });
    });
    describe('members', function () {
      it('TODO');
    });
    describe('countMembers(id, status)', function () {
      context('good status', function () {
        context('id exist', function () {
          for(let st of possibleStatus) {
            it('[status: '+st+'] should return a promise and resolve it with # of '+st, function () {
              return expect(project.countMembers(existentProject.id, st)).to.eventually.equal(existentProject.members[st].length);
            });
          }
        });
        context('id not exist', function () {
          it('should return promise -> reject: error 404', function () {
            return expect(project.countMembers('nonexistent-id', 'member')).to.eventually.be.rejectedWith('404');
          });
        });
      });
      context('bad status', function () {
        it('should return promise -> reject: error 400', function () {
          return expect(project.countMembers(existentProject.id, 'random')).to.eventually.be.rejectedWith('400');
        });
      });
    });
  });
});

