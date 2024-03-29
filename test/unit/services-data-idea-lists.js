'use strict';

var Database = require('arangojs');
//var config = require('../../services/db-config');
var config = require('../db-config');

var chai = require('chai')
var expect = chai.expect;

chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

var db = new Database({url: config.url, databaseName: config.dbname});

var idea = require('../../services/data/idea')(db);

var dbPopulate = require('../dbPopulate')(db);
var collections = require('../../services/data/collections');

var dbData = require('../functional/idea/dbDataIdeas');


describe('database/idea (lists)', function () {

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

  describe('popular()', function () {
    context('most followers', function () {
      it('should return a promise and resolve it with array of 5 most followed ideas & number of followers', function (done) {
        return idea.popular('followers', {})
          .then(function (_popular) {
            let expected = [3,5,4,6,7];
            for(let i=0, len = expected.length; i<len; ++i) {
              expect(_popular[i].name).to.equal('idea'+String(expected[i]));
              expect(_popular[i].followerno).to.equal(5-i);
            }
          })
          .then(done, done);
      });
    });
    context('most stars', function () {
      it('should fulfill with array of 5 most starred ideas');
      it('should fulfill with # of stars');
    });
    context('most followers + stars', function () {
      it('should fulfill with array of 5 most followed + starred ideas');
      it('should fulfill with # of followers and # of stars');
    });
    context('most commented', function () {
      it('should fulfill with array of 5 most commented ideas & number of comments');
    });
  });

  describe('newest()', function () {
    it('should fulfill with 5 newest ideas including their creation time', function (done) {
      return idea.newest()
        .then(function (_new) {
          expect(_new).to.be.an('array');
          console.log(_new);
          for(let i=0, len=_new.length; i<len-1; ++i) {
            expect(_new[i].created).to.be.a('number');
            expect(_new[i].created).to.be.at.least(_new[i+1].created);
          }
        })
        .then(done, done);
    });
  });

  describe('random', function () {
    it('should fulfill with random idea', function (done) {
      return idea.random()
        .then(function (_rand) {
          expect(_rand).to.be.an('array');
          console.log(_rand);
          expect(_rand.length).to.equal(1);
          for(let i=0, len=_rand.length; i<len-1; ++i) {
            expect(_rand[i]).to.have.a.property('id');
            expect(_rand[i]).to.have.a.property('name');
          }
        })
        .then(done, done);
    });
  });
});

