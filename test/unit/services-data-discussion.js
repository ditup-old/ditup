'use strict';

var Database = require('arangojs');
var config = require('../../services/db-config');

var chai = require('chai')
var expect = chai.expect;

chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

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
  
  describe('readPost(id, index)', function () {});

  describe('updatePost', function () {
    context('when discussion doesn\'t exist', function () {
      var nonexistentId = '2111111111';
      it('should return a promise and reject it with 404 error', function () {
        return expect(discussion.updatePost(nonexistentId, {
            index: 0,
            user: 'mrkvon',
            text: 'this is a new post text2',
            updated: Date.now()
          })).to.eventually.be.rejectedWith('404');
      });
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
  describe('removePost(discussinId, {index: number, user: string, deleted: date}, directEditingRights)', function () {
    context('when discussion doesn\'t exist', function () {
      var nonexistentId = '2111111111';
      it('should return a promise and reject it with 404 error', function () {
        return expect(discussion.removePost(nonexistentId, {
            index: 0,
            user: 'mrkvon',
            deleted: Date.now()
          })).to.eventually.be.rejectedWith('404');
      });
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
          return expect(discussion.removePost(existentId, {
              index: 5,
              user: 'mrkvon',
              deleted: Date.now()
            })).to.eventually.be.rejectedWith('404');
        });
        
      });
      context('when post exists', function () {
        context('when user has rights to delete post (either creator or admin)', function () {
          it('should delete the post and return a promise and resolve it', function (done) {
            Promise.all([
              discussion.removePost(existentId, {index: 1, user: 'test1'}),
              discussion.removePost(existentId, {index: 2, user: 'test2'}, true)
            ])
              .then(function () {
                return discussion.read(existentId);
              })
              .then(function (discussion) {
                expect(discussion.posts[1]).to.be.deep.equal(null);
                expect(discussion.posts[2]).to.be.deep.equal(null);
              })
              .then(done, done);
          });
        });
        context('when user doesn\'t have rights to delete the post', function () {
          it('should return a promise and reject it with 401 error', function () {
            return expect(discussion.removePost(existentId, {
                index: 2,
                user: 'test1'
              }, false)).to.eventually.be.rejectedWith('401');
          });
        });
      });
    });
  });

  describe('addTag', function () {
    var existentTag = 'test-tag-1';
    var user = 'test1';
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
          })
          .then(done, done);
      });

      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });

      afterEach(function(done) {
        db.query('FOR dt IN discussionTag REMOVE dt IN discussionTag')
          .then(function () {
            done();
          }, done);
      });

      
      context('when user has rights to add tag', function () {
        context('when tag exists', function () {
          context('when discussion is already tagged with this tag', function () {
            it('should return a promise and reject it with 409 code', function () {
                return expect(
                  discussion.addTag(existentId, existentTag, user)
                    .then(function () {
                      return discussion.addTag(existentId, existentTag, user);
                    })
                  ).to.eventually.be.rejectedWith('409');
            });
          });
          context('when discussion was not tagged yet', function () {
            it('should return a promise, create proper changes in database and fulfill the promise', function () {
              return expect(discussion.addTag(existentId, existentTag, user)).to.eventually.be.fulfilled;
            });
          });
        });
        context('when tag doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(discussion.addTag(existentId, 'nonexistent-tag', user)).to.eventually.be.rejectedWith('404');
          });
        });
      });
      context('when user doesn\'t have rights to add tag', function () {
        it('should return a promise and reject it with 401');
      });
    });
    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code', function () {
        return expect(discussion.addTag('211111111111111', existentTag, user)).to.eventually.be.rejectedWith('404');
      });
    });
  });

  describe('removeTag', function () {
    var existentTag = 'test-tag-1';
    var user = 'test1';
    context('when discussion exists', function () {
      //create discussion
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

      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });

      afterEach(function(done) {
        db.query('FOR dt IN discussionTag REMOVE dt IN discussionTag')
          .then(function () {
            done();
          }, done);
      });

      
      context('when user has rights to remove tag', function () {
        context('when tag exists', function () {
          context('when discussion is not tagged with this tag', function () {
            it('should return a promise and reject it with 404 code', function () {
                return expect(discussion.removeTag(existentId, existentTag)).to.eventually.be.rejectedWith('404');
            });
          });
          context('when discussion is tagged', function () {
            beforeEach(function (done) {
              return discussion.addTag(existentId, existentTag, user)
                .then(function () {
                  done()
                }, done);
            });

            afterEach(function(done) {
              db.query('FOR dt IN discussionTag REMOVE dt IN discussionTag')
                .then(function () {
                  done();
                }, done);
            });

            it('should return a promise, create proper changes in database and fulfill the promise', function () {
              return expect(discussion.removeTag(existentId, existentTag)).to.eventually.be.fulfilled;
            });
          });
        });
        context('when tag doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(discussion.removeTag(existentId, 'nonexistent-tag')).to.eventually.be.rejectedWith('404');
          });
        });
      });
      context('when user doesn\'t have rights to remove tag', function () {
        it('should return a promise and reject it with 401');
      });
    });
    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code', function () {
        return expect(discussion.removeTag('211111111111111', existentTag)).to.eventually.be.rejectedWith('404');
      });
    });
    
  });

  describe('tags(id)', function () {
    var existentTags = ['test-tag-1', 'test-tag-2'];
    var user = 'test1';
    //this function should read tags of discussion
    context('when discussion exists', function () {
      //create discussion
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

      afterEach(function(done) {
        db.query('FOR d IN discussions REMOVE d IN discussions')
          .then(function () {
            done();
          }, done);
      });

      afterEach(function(done) {
        db.query('FOR dt IN discussionTag REMOVE dt IN discussionTag')
          .then(function () {
            done();
          }, done);
      });

      it('should return a promise and resolve it with an array of all discussion tags (empty)', function () {
        return expect(discussion.tags(existentId)).to.eventually.deep.equal([]);
      });

      it('should return a promise and resolve it with an array of all discussion tags (some tags)', function (done) {
        Promise.all([
          discussion.addTag(existentId, existentTags[0], user),
          discussion.addTag(existentId, existentTags[1], user)
        ])
          .then(function () {
            return discussion.tags(existentId);
          })
          .then(function (tags) {
            expect(tags).to.include.a.thing.that.has.property('name', 'test-tag-1');
            expect(tags).to.include.a.thing.that.has.property('name', 'test-tag-2');
          })
          .then(done, done);
      });
    });
    context('when discussion doesn\'t exist', function () {
    });
  });
  describe('follow', function () {});
  describe('following', function () {});
  describe('unfollow', function () {});
  describe('hide', function () {});
  describe('unhide', function () {});
  describe('readDiscussionsByTags', function () {});

});
