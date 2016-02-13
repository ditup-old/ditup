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
      it('should reject a promise with a proper error message', function () {
        return expect(discussion.create(incompleteData)).to.eventually.be.rejectedWith('missing data');
      });
    });

    context('when data is complete', function () {});
  });
  describe('read', function () {});
  describe('update', function () {})
  describe('delete', function () {});
  describe('addMessage', function () {});
  describe('removeMessage', function () {});
  describe('addTag', function () {});
  describe('removeTag', function () {});
  describe('follow', function () {});
  describe('unfollow', function () {});
  describe('hide', function () {});

});
