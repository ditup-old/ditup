'use strict';

var Database = require('arangojs');
var config = require('../../services/db-config');

var chai = require('chai')
var expect = chai.expect;

chai.use(require('chai-as-promised'));

var db = new Database({url: config.url, databaseName: config.dbname});

var discussion = require('../../services/data/discussion')(db);

var completeData = {
  topic: 'discussion topic',
  creator: 'test1',
  created: Date.now()
};

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
          expect(discussion.read(nonexistentId)).to.eventually.be.rejectedWith('404')
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
        return expect(discussion.delete(nonexistentId)).to.eventually.be.rejectedWith('404');
      });
    });
  });
  describe('addPost', function () {
    var postText = 'this is some post text. Lorem ipsum dolor sic amet';
    var author = 'mrkvon';
    var nonexistentAuthor = 'nonexistent-user';

    context('when discussion with :id exists and author exists', function () {
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
      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });

      it('should add post to the database and return promise and fulfill it with post id', function () {
        return expect(discussion.addPost(existentId, {text: postText, creator: author})).to.eventually.deep.equal({id: 0})
          .then(function () {
            return expect(discussion.addPost(existentId, {text: postText, creator: author})).to.eventually.deep.equal({id: 1});
          });
      });
    });

    context('when discussion with :id doesn\'t exist', function () {
      var nonexistentId = String(211111111111111);
      it('should return promise and reject it with proper error (404)', function () {
        return expect(discussion.addPost(nonexistentId, {text: postText, creator: author})).to.eventually.be.rejectedWith('404');
      });
    });

    context('when author doesn\'t exist', function () {
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
      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });
      it('should return a promise and reject it with proper error (404)', function () {
        return expect(discussion.addPost(existentId, {text: postText, creator: nonexistentAuthor})).to.eventually.be.rejectedWith('404');
      });
    });
  });

  describe('updatePost', function () {
    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 error');
    });

    context('when discussion exists', function () {
      //create discussion and add some posts to it
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
            return discussion.addPost(existentId, {creator: 'mrkvon', text: 'this is some post text'});
          })
          .then(function () {
            return discussion.addPost(existentId, {creator: 'test1', text: 'this is some post text 2'});
          })
          .then(function () {
            return discussion.addPost(existentId, {creator: 'mrkvon', text: 'this is some post text 3'});
          })
          .then(function () {
            done();
          }, done);
      });
      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });
    

      context('when post doesn\'t exist', function () {
        it('should return a promise and reject it with 404 error', function () {
          return expect(discussion.updatePost(existentId, {
              index: 5,
              user: 'mrkvon',
              text: 'this is a new post text2',
              updated: Date.now()
            })).to.eventually.be.rejectedWith('404');
        });
      });

      context('when post was created by user && data is ok', function () {

        it('should update the post and return a promise and resolve it', function () {
          var updatedPost;
          return expect(
            discussion.updatePost(existentId, {
              index: 1,
              user: 'test1',
              text: 'this is a new post text2',
              updated: Date.now()
            })
              .then(function () {
                return discussion.read(existentId);
              })
              .then(function (disc) {
                updatedPost = disc.posts[1];
                return updatedPost;
              })
          ).to.eventually.have.property('text', 'this is a new post text2')
            .then(function () {
              expect(updatedPost).to.have.property('creator');
              expect(updatedPost).to.have.property('updated');
            });
        });
      });

      context('when access as admin and data is ok', function () {
        it('should update the post and return a promise and resolve it', function () {
          var updatedPost;
          return expect(
            discussion.updatePost(existentId, {
              index: 1,
              user: 'mrkvon',
              text: 'this is a new post text2',
              updated: Date.now()
            }, true)
              .then(function () {
                return discussion.read(existentId);
              })
              .then(function (disc) {
                updatedPost = disc.posts[1];
                return updatedPost;
              })
          ).to.eventually.have.property('text', 'this is a new post text2')
            .then(function () {
              expect(updatedPost).to.have.property('creator');
              expect(updatedPost).to.have.property('updated');
            });
        });
      });

      context('when allowed access and data is incomplete', function () {
        it('should return and reject a promise with 400 (bad data)', function () {
          return expect(
            discussion.updatePost(existentId, {
              index: 1,
              user: 'mrkvon',
              updated: Date.now()
            }, true)
          ).to.eventually.be.rejectedWith('400');
        });
      });

      context('when access not allowed', function () {
        it('should return a promise and reject it with error 401.', function () {
          return expect(discussion.updatePost(existentId, {
              index: 1,
              user: 'mrkvon',
              text: 'this is a new post text2',
              updated: Date.now()
            })).to.eventually.be.rejectedWith('401');
        });
      });
    });
  });
  describe('removePost', function () {});
  describe('addTag', function () {});
  describe('removeTag', function () {});
  describe('follow', function () {});
  describe('unfollow', function () {});
  describe('hide', function () {});
  describe('readTagDiscussions', function () {});

});