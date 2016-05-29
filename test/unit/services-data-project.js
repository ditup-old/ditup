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

  dbData.projectMember = [
    {collection: 0, user: 1, status: 'joining'},
    {collection: 0, user: 2, status: 'invited'},
    {collection: 0, user: 3, status: 'member'},
  ];

  var existentProject = dbData.projects[0];
  var existentUser = dbData.users[0]; //user with no membership
  var joiningUser = dbData.users[1];
  var invitedUser = dbData.users[2];
  var member = dbData.users[3];

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
    describe('members', function () {
      it('TODO');
    });
    describe('countMembers', function () {
      it('TODO');
    });
  });
});

