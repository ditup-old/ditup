'use strict';

var Database = require('arangojs');
var config = require('../../services/db-config');

var chai = require('chai')
var expect = chai.expect;

chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

var db = new Database({url: config.url, databaseName: config.dbname});

var challenge = require('../../services/data/challenge')(db);

var completeData = {
  name: 'challenge name',
  description: 'challenge description',
  creator: 'test1',
  created: Date.now()
};

describe('data/challenge', function () {
  describe('create', function () {
    context('when data is incomplete', function () {
      var incompleteData = {
      };
      it('should return a promise and reject it with a proper error message', function () {
        return expect(challenge.create(incompleteData)).to.eventually.be.rejectedWith('incomplete data');
      });
    });

    context('when data is complete', function () {

      it('should save a challenge to the database, return a promise and resolve it with the challenge id', function () {
        return expect(challenge.create(completeData)).to.eventually.have.property('id');
      });
    });
  });
});
