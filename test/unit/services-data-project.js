'use strict';

var Database = require('arangojs');
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
//************END

  var existentProject = dbData.projects[0];
  var existentUser = dbData.users[0]; //user with no membership
  var joiningUser = dbData.users[1];
  var invitedUser = dbData.users[2];
  var member = dbData.users[3];

  var users = {
    invited: invitedUser,
    joining: joiningUser,
    member: member,
    none: existentUser
  };

  describe('membership functions', function () {
    let possibleStatus = ['joining', 'invited', 'member'];
    describe('memberOf', function () {
      it('TODO');
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
