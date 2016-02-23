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

  afterEach(function(done) {
    db.query('FOR ufd IN userFollowDiscussion REMOVE ufd IN userFollowDiscussion')
      .then(function () {
        done();
      }, done);
  });




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

  describe('addTag(id, tagname, username)', function () {
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
  describe('follow(id, username)', function () {
    var username = 'test1';
    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code', function () {
        return expect(discussion.follow('211111111111111111', username)).to.eventually.be.rejectedWith('404');
      });
    })
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

      afterEach(function(done) {
        db.query('FOR ufd IN userFollowDiscussion REMOVE ufd IN userFollowDiscussion')
          .then(function () {
            done();
          }, done);
      });

      context('when user doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(discussion.follow(existentId, 'non-existent-user')).to.eventually.be.rejectedWith('404');
        });
      });

      context('when user exists', function () {
        context('when user is already following', function () {
          it('should return a promise and reject it with 409 code', function (done) {
            return discussion.follow(existentId, username)
              .then(function () {
                return expect(discussion.follow(existentId, username)).to.be.eventually.rejectedWith('409');
              })
              .then(done, done);
          });
        });

        context('when user is not following yet', function () {
          it('should insert follow to the database and return a promise and resolve it with 201 code (created)', function () {
            return expect(discussion.follow(existentId, username)).to.eventually.equal(201);
          });
        });
        context('when user has the discussion hidden', function () {
          it('should update hidden > follows in the database and return a promise and resolve it with 200 code (OK)', function (done) {
            return discussion.follow(existentId, username, true)
              .then(function () {
                return expect(discussion.follow(existentId, username)).to.eventually.equal(200);
              })
              .then(function () {done();}, done);
          });
        });
      });
    });
  });
  //what discussions is user following
  describe('following(username)', function () {
    var username = 'test1';
    var topics = ['discussion0','discussion1', 'discussion2', 'discussion3'];
    //create discussion
    var existentIds = [];
    beforeEach(function(done) {
      var dpromises = [];
      for(let i = 0, len = topics.length; i < len; i++) {
        dpromises[i] = discussion.create({topic: topics[i], created: Date.now(), creator: username});
      }
      Promise.all(dpromises)
        .then(function (objArray) {
          for(let i = 0, len = objArray.length; i<len; i++){
            existentIds[i] = objArray[i].id;
          }
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

    afterEach(function(done) {
      db.query('FOR ufd IN userFollowDiscussion REMOVE ufd IN userFollowDiscussion')
        .then(function () {
          done();
        }, done);
    });


    context('when user exists', function () {
      it('should return a promise and resolve it with an array of discussions user follows: []', function () {
        return expect(discussion.following(username)).to.eventually.deep.equal([]);
      });
      it('should return a promise and resolve it with an array of discussions user follows: [discussion0, discussion1, discussion3]', function (done) {
        Promise.all([
          discussion.follow(existentIds[0], username),
          discussion.follow(existentIds[1], username),
          discussion.follow(existentIds[3], username)
        ])
          .then(function () {
            return discussion.following(username);
          })
          .then(function (discussions) {
            expect(discussions).to.include.a.thing.that.has.property('topic', 'discussion0');
            expect(discussions).to.include.a.thing.that.has.property('topic', 'discussion1');
            expect(discussions).to.include.a.thing.that.has.property('topic', 'discussion3');
          })
          .then(done, done);
      });
    });
    context('when user doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code'/*, function () {
        return expect(discussion.following('nonexistent-user')).to.eventually.be.rejectedWith('404');
      }*/);
    });
  });
  //does user follow a discussion? bool.
  describe('followingUser(id, username)', function () {
    context('when discussion doesn\'t exist', function () {});
    context('when discussion exists', function () {
      //create discussion
      var completeData = {
        topic: 'discussion topic',
        creator: 'test1',
        created: Date.now()
      };

      var existentId;
      var username = 'test1';
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
        db.query('FOR ufd IN userFollowDiscussion REMOVE ufd IN userFollowDiscussion')
          .then(function () {
            done();
          }, done);
      });
      context('when user doesn\'t exist', function () {});
      context('when user exists', function () {
        context('when user follows the discussion', function () {
          it('should return a promise and resove it with true', function () {
            return expect(discussion.follow(existentId, username)
                .then(function () {
                  return discussion.followingUser(existentId, username)
                })).to.eventually.deep.equal(true);
          });
        });
        context('when user doesn\'t follow the discussion', function () {
          it('should return a promise and resove it with false', function () {
            return expect(discussion.followingUser(existentId, username)).to.eventually.deep.equal(false);
          });
        });
      });
    });
  });

  describe('followers(id)', function () {
    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code');
    });
    context('when discussion exists', function () {
      it('should return a promise and resolve it with []', function () {
        return expect(discussion.followers(existentId)).to.eventually.deep.equal([]);
      });
      it('should return a promise and resolve it with [user, user, user]', function (done) {
        Promise.all([
          discussion.follow(existentId, 'test1'),
          discussion.follow(existentId, 'test4'),
          discussion.follow(existentId, 'test5'),
          discussion.hide(existentId, 'test6')
        ])
          .then(function () {
            return discussion.followers(existentId);
          })
          .then(function (users) {
            expect(users).to.include.a.thing.that.has.property('username', 'test1');
            expect(users).to.include.a.thing.that.has.property('username', 'test4');
            expect(users).to.include.a.thing.that.has.property('username', 'test5');
            expect(users).to.not.include.a.thing.that.has.property('username', 'test6');
          })
          .then(done, done);
      });
    });
  });

  describe('unfollow(id, username)', function () {
    var username = 'test1';

    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code', function () {
        return expect(discussion.unfollow('211111111111111111', username)).to.eventually.be.rejectedWith('404');
      });
    });

    context('when discussion exists', function () {

      context('when user doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(discussion.unfollow(existentId, 'non-existent-user')).to.eventually.be.rejectedWith('404');
        });
      });

      context('when user exists', function () {
        context('when user is following', function () {
          it('should remove the follow from database, return a promise and resolve it', function (done) {
            return discussion.follow(existentId, username)
              .then(function () {
                return expect(discussion.unfollow(existentId, username)).to.eventually.be.fulfilled;
              })
              .then(function () {done();}, done);
          });
        });

        context('when user is not following', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(discussion.unfollow(existentId, username)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user has the discussion hidden', function () {
          it('should return a promise and reject it with 404 code', function (done) {
            return discussion.follow(existentId, username, true)
              .then(function () {
                return expect(discussion.unfollow(existentId, username)).to.eventually.be.rejectedWith('404');
              })
              .then(function () {done();}, done);
          });
        });
      });
    });
  });
  describe('hide', function () {
    var username = 'test1';
    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code', function () {
        return expect(discussion.hide('211111111111111111', username)).to.eventually.be.rejectedWith('404');
      });
    });
    context('when discussion exists', function () {
      context('when user doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(discussion.hide(existentId, 'non-existent-user')).to.eventually.be.rejectedWith('404');
        });
      });

      context('when user exists', function () {
        context('when discussion is already hidden', function () {
          it('should return a promise and reject it with 409 code', function (done) {
            return discussion.hide(existentId, username)
              .then(function () {
                return expect(discussion.hide(existentId, username)).to.be.eventually.rejectedWith('409');
              })
              .then(done, done);
          });
        });

        context('when discussion is not hidden yet', function () {
          it('should insert hide to the database and return a promise and resolve it with 201 code (created)', function () {
            return expect(discussion.hide(existentId, username)).to.eventually.equal(201);
          });
        });
        context('when user follows the discussion', function () {
          it('should update follows > hidden in the database and return a promise and resolve it with 200 code (OK)', function (done) {
            return discussion.follow(existentId, username)
              .then(function () {
                return expect(discussion.hide(existentId, username)).to.eventually.equal(200);
              })
              .then(function () {done();}, done);
          });
        });
      });
    });
  });
  describe('unhide', function () {
    var username = 'test1';

    context('when discussion doesn\'t exist', function () {
      it('should return a promise and reject it with 404 code', function () {
        return expect(discussion.unhide('211111111111111111', username)).to.eventually.be.rejectedWith('404');
      });
    });

    context('when discussion exists', function () {
      context('when user doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(discussion.unhide(existentId, 'non-existent-user')).to.eventually.be.rejectedWith('404');
        });
      });

      context('when user exists', function () {
        context('when user has the discussion hidden', function () {
          it('should remove the hide from database, return a promise and resolve it', function (done) {
            return discussion.hide(existentId, username)
              .then(function () {
                return expect(discussion.unhide(existentId, username)).to.eventually.be.fulfilled;
              })
              .then(function () {done();}, done);
          });
        });

        context('when user has not the discussaion hidden', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(discussion.unhide(existentId, username)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user follows the discussion', function () {
          it('should return a promise and reject it with 404 code', function (done) {
            return discussion.follow(existentId, username)
              .then(function () {
                return expect(discussion.unhide(existentId, username)).to.eventually.be.rejectedWith('404');
              })
              .then(function () {done();}, done);
          });
        });
      });
    });
  });
  describe('readDiscussionsByTags(array tags, ?username)', function () {
    var username = 'test1';
    var username2 = 'test4';
    var username3 = 'test5';
    var discussionTags = [
      {topic: 'discussion0', id: null, tags: ['test-tag-2', 'music']},
      {topic: 'discussion1', id: null, tags: ['art', 'test-tag-1', 'test-tag-2']},
      {topic: 'discussion2', id: null, tags: ['music', 'test-tag-2']},
      {topic: 'discussion3', id: null, tags: ['test-tag-1', 'travel', 'busking']},
      {topic: 'discussion4', id: null, tags: ['test-tag-1', 'test-tag-2', 'travel', 'busking']},
      {topic: 'discussion5', id: null, tags: ['art']}
    ];
    //create discussion
    beforeEach(function(done) {
      var dpromises = [];
      for(let dt of discussionTags) {
        dpromises.push(discussion.create({topic: dt.topic, created: Date.now(), creator: username}));
      }
      Promise.all(dpromises)
        .then(function (objArray) {
          for(let i = 0, len = objArray.length; i<len; i++){
            discussionTags[i].id = objArray[i].id;
          }

          var exePromises = [];
          for(let dt of discussionTags) {
            for(let tg of dt.tags) {
              exePromises.push(discussion.addTag(dt.id, tg, username2));
            }
          }

          exePromises.push(discussion.hide(discussionTags[0].id, username3));
          exePromises.push(discussion.hide(discussionTags[2].id, username3));
          exePromises.push(discussion.follow(discussionTags[1].id, username3));
          
          return Promise.all(exePromises);
        })
        .then(function () {})
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

    afterEach(function(done) {
      db.query('FOR ufd IN userFollowDiscussion REMOVE ufd IN userFollowDiscussion')
        .then(function () {
          done();
        }, done);
    });

    it('when tag array is empty: should return a proper array of discussions found: []', function () {
      return expect(discussion.readDiscussionsByTags([])).to.eventually.be.deep.equal([]);
    });

    it('when tag array contains only non-existent tags should return a proper array of discussions found: []', function () {
      return expect(discussion.readDiscussionsByTags(['non-existent-tag'])).to.eventually.be.deep.equal([]);
    });

    it('when tag array contains valid tags: should return a proper array of discussions found: [{discussion: {...}, tags: [...]}, {...}]', function (done) {
      return discussion.readDiscussionsByTags(['test-tag-1'])
        .then(function (finds) {
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion1');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion3');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion4');

          expect(finds).to.not.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion0');
          expect(finds).to.not.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion2');
          expect(finds).to.not.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion5');
        })
        .then(done, done);
    });

    it('when tag array contains more valid tags: should return a proper array of discussions found: [{discussion: {...}, tags: [...]}, {...}]', function (done) {
      return discussion.readDiscussionsByTags(['test-tag-2', 'travel', 'busking'])
        .then(function (finds) {
          expect(finds[0]).to.have.a.deep.property('discussion.topic', 'discussion4');
          expect(finds[0].tagno).to.deep.equal(3);

          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion0');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion1');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion2');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion3');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion4');
          expect(finds).to.not.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion5');
        })
        .then(done, done);
    });

    it('when tag array contains more valid tags and username: should return a proper array of discussions found: [{discussion: {...}, tags: [...]}, {...}], and hidden discussions not included', function (done) {
      return discussion.readDiscussionsByTags(['test-tag-2', 'travel', 'busking'], username3)
        .then(function (finds) {
          expect(finds[0]).to.have.a.deep.property('discussion.topic', 'discussion4');
          expect(finds[0].tagno).to.deep.equal(3);

          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion1');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion3');
          expect(finds).to.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion4');
          expect(finds).to.not.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion0');
          expect(finds).to.not.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion2');
          expect(finds).to.not.include.a.thing.that.has.a.deep.property('discussion.topic', 'discussion5');
        })
        .then(done, done);
    });
  });

  describe('visit(id, username)', function () {
    var username = 'test6';
    context('when discussion exists', function () {
      context('when username exists', function () {
        context('when user follows discussion', function () {
          beforeEach(function (done) {
            return discussion.follow(existentId, username)
              .then(function () {done ();}, done);
          });
          it('should return a promise and resolve it with true', function () {
            return expect(discussion.visit(existentId, username)).to.eventually.equal(true);
          });
        });
        context('when user doesn\'t follow discussion', function () {
          it('should return a promise and resolve it with false', function () {
            return expect(discussion.visit(existentId, username)).to.eventually.equal(false);
          });
        });
      });
    });
  });

  describe('lastVisit(id, username)', function () {
    var username = 'test5';
    context('when discussion exists', function () {
      context('when username exists', function () {
        context('when user follows discussion', function () {
          beforeEach(function (done) {
            discussion.follow(existentId, username)
              .then(function () {
                return discussion.visit(existentId, username);
              })
              .then(function () {done();}, done);
          });

          it('should return a timestamp of user\'s last visit', function () {
            return expect(discussion.lastVisit(existentId, username)).to.eventually.be.within(Date.now()-10000, Date.now()+10000);
          });
        });

        context('when user follows discussion but never visited it', function () {
          beforeEach(function (done) {
            discussion.follow(existentId, username)
              .then(function () {done();}, done);
          });
          it('should return 0', function () {
            return expect(discussion.lastVisit(existentId, username)).to.eventually.equal(0);
          });
        });

        context('when user doesn\'t follow discussion', function () {
          beforeEach(function (done) {
            discussion.visit(existentId, username)
              .then(function () {done();}, done);
          });
          it('should return null', function () {
            return expect(discussion.lastVisit(existentId, username)).to.eventually.equal(null);
          });
        });
      });
    });
  });

});
