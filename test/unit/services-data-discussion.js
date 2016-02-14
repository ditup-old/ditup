'use strict';

var Database = require('arangojs');
var config = require('../../services/db-config');

var chai = require('chai')
var expect = chai.expect;

chai.use(require('chai-as-promised'));

var db = new Database({url: config.url, databaseName: config.dbname});

var discussion = require('../../services/data/discussion')(db);

describe('database/discussion', function () {
  describe('create', function () {
    context('when data is incomplete', function () {
      var incompleteData = {
      };
      it('should return a promise and reject it with a proper error message', function () {
        return expect(discussion.create(incompleteData)).to.eventually.be.rejectedWith('incomplete data');
      });
    });

    context('when data is complete', function () {
      var completeData = {
        topic: 'discussion topic',
        creator: 'test1',
        created: Date.now()
      };

      it('should save a disussion to the database, return a promise and resolve it with the discussion id', function () {
        return expect(discussion.create(completeData)).to.eventually.have.property('id');
      });
    });
  });

  describe('read(id)', function () {
    context('when discussion with :id exists', function () {
      var completeData = {
        topic: 'discussion topic',
        creator: 'test1',
        created: Date.now()
      };
      var existentId;
      beforeEach(function(done) {
        discussion.create(completeData)
          .then(function (obj) {
            existentId = obj.id;
          })
          .then(function () {
            done();
          }, done);
      });
      it('should return the discussion object (including some posts)', function () {
        return Promise.all([
          expect(discussion.read(existentId)).to.eventually.be.fulfilled,
          expect(discussion.read(existentId)).to.eventually.have.property('topic'),
          expect(discussion.read(existentId)).to.eventually.have.property('creator'),
          expect(discussion.read(existentId)).to.eventually.have.property('created'),
          expect(discussion.read(existentId)).to.eventually.have.property('posts')
        ]);
      });
      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });
    });
    context('when discussion with :id doesn\'t exist', function () {
      var nonexistentId = String(211111111111111);
      it('should return a promise and reject it with a proper error message', function () {
        return Promise.all([
          expect(discussion.read(nonexistentId)).to.eventually.be.rejectedWith(404)
        ]);
      });
    });
  });
  describe('update', function () {})
  describe('delete(id)', function () {
    context('when discussion with :id exists', function () {
      var completeData = {
        topic: 'discussion topic',
        creator: 'test1',
        created: Date.now()
      };
      var existentId;
      beforeEach(function(done) {
        discussion.create(completeData)
          .then(function (obj) {
            existentId = obj.id;
          })
          .then(done, done);
      });
      it('should delete the discussion from the database and be fulfilled', function () {
        return expect(discussion.delete(existentId)).to.eventually.be.fulfilled;
      });
      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });
    });
    context('when discussion with :id doesn\'t exist', function () {
      var nonexistentId = String(211111111111111);
      it('should return a promise and reject it with a proper error message', function () {
        return expect(discussion.delete(nonexistentId)).to.eventually.be.rejectedWith(404);
      });
    });
  });
  describe('addPost', function () {});
  describe('updatePost', function () {});
  describe('removePost', function () {});
  describe('addTag', function () {});
  describe('removeTag', function () {});
  describe('follow', function () {});
  describe('unfollow', function () {});
  describe('hide', function () {});
  describe('readTagDiscussions', function () {});

});
