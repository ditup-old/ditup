'use strict';

var Database = require('arangojs');
var config = require('../../services/db-config');

var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));

var db = new Database({url: config.url, databaseName: config.dbname});

var idea = require('../../services/data/idea')(db);

var completeData = {
  name: 'idea name',
  description: 'idea description',
  creator: 'test1',
  created: Date.now()
};

var existentIdea = {
  name: 'existent idea name',
  description: 'existent idea description',
  creator: 'test1',
  created: Date.now()
};

describe('data/idea', function () {

  //removing all ideas from the database after each test
  var existentId;
  var nonexistentId = '1111111111111111111';

  beforeEach(function(done) {
    idea.create(existentIdea)
      .then(function (obj) {
        existentId = obj.id;
        existentIdea.id = obj.id;
      })
      .then(done, done);
  });

  afterEach(function (done) {
    return db.query('FOR c IN ideas REMOVE c IN ideas', {}).then(function () {done();}, done);
  });
  
  afterEach(function (done) {
    return db.query('FOR cca IN ideaCommentAuthor REMOVE cca IN ideaCommentAuthor', {}).then(function () {done();}, done)
  });

  describe('create(data)', function () {
    context('when data is incomplete', function () {
      var incompleteData = {
      };
      it('should return a promise and reject it with a proper error message', function () {
        return expect(idea.create(incompleteData)).to.eventually.be.rejectedWith('incomplete data');
      });
    });

    context('when data is complete', function () {

      it('should save a idea to the database, return a promise and resolve it with the idea id', function () {
        return expect(idea.create(completeData)).to.eventually.have.property('id');
      });
    });
  });

  describe('read(id)', function () {
    context('when idea with :id exists', function () {
      it('should return the idea object', function () {
        return Promise.all([
          expect(idea.read(existentId)).to.eventually.be.fulfilled,
          expect(idea.read(existentId)).to.eventually.have.property('name'),
          expect(idea.read(existentId)).to.eventually.have.property('description'),
          expect(idea.read(existentId)).to.eventually.have.property('creator'),
          expect(idea.read(existentId)).to.eventually.have.property('created')
        ]);
      });
    });

    context('when idea with :id doesn\'t exist', function () {
      it('should return a promise and reject it with a proper error message', function () {
        return Promise.all([
          expect(idea.read(nonexistentId)).to.eventually.be.rejectedWith('404')
        ]);
      });
    });
  });

  describe('update(id, data)', function () {
    it('TODO!');
  });

  describe('delete(id)', function () {
    context('when idea with :id exists', function () {
      it('should delete the idea from the database and be fulfilled', function () {
        return expect(idea.delete(existentId)).to.eventually.be.fulfilled;
      });
    });
    context('when idea with :id doesn\'t exist', function () {
      it('should return a promise and reject it with a proper error message', function () {
        return expect(idea.delete(nonexistentId)).to.eventually.be.rejectedWith('404');
      });
    });
  });
  
  describe('comment functions', function () {
    let newComment = {
      text: 'some comment test',
      creator: 'test1'
    };

    let existentComments = [
      {
        text: 'some existent comment test',
        creator: 'test1'
      }
    ];

    beforeEach(function (done) {
      let pms = [];
      for(let ec of existentComments) {
        pms.push(idea.addComment(existentId, {text: ec.text}, ec.creator));
      }
      return Promise.all(pms)
        .then(function (_out) {
          for(let i=0, len=_out.length; i<len; ++i) {
            existentComments[i].id = _out[i].id;
          }
          console.log(existentComments);
        })
        .then(done, done);
    });

    describe('addComment(id, data)', function () {
      context('when idea exists', function () {
        context('when user has rights to add a comment', function () {
          it('should return a promise, create proper changes in database and fulfill the promise with comment id', function () {
            return Promise.all([
              expect(idea.addComment(existentId, newComment, newComment.creator)).to.eventually.have.property('id'),
              expect(idea.addComment(existentId, newComment, newComment.creator)).to.eventually.have.property('id').which.is.a('string')
            ]);
          });
        });

        context('when user doesn\'t have rights to add a comment', function () {
          it('should return a promise and reject it with 401'); // should be taken care of on higher level
        });
      });

      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.addComment(nonexistentId, newComment, newComment.creator)).to.eventually.be.rejectedWith('404');
        });
      });
    });

    describe('readComment(commentId)', function () {});
    describe('readComments(id, specifics)', function () {
      context('when idea exists', function () {
        context('when user has rights to read comments', function () {
          it('should return a promise and fulfill it with the list of comments', function () {
            return idea.readComments(existentId)
              .then(function (chc) {
                expect(chc).to.be.an('array');
                for(let ec of existentComments) {
                  expect(chc).to.include.a.thing.that.has.property('text', ec.text);
                  expect(chc).to.include.a.thing.that.has.property('id', ec.id);
                  expect(chc).to.include.a.thing.that.has.deep.property('author.username', ec.creator);
                }
              });
          });
        });

        context('when user doesn\'t have rights to read comments', function () {
          it('should return a promise and reject it with 401'); // should be taken care of on higher level
        });
      });

      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.readComments(nonexistentId)).to.eventually.be.rejectedWith('404');
        });
      });
    });
    describe('updateComment(commentId, data)', function () {});

    describe('removeComment(commentId, constraints)', function () {
      //constraints are idea id ('id') and 'author' - if not match, the comment not possible. or optionally admin: true
      context('when the comment exists', function () {
        context('when user is the author', function () {
          //either constraints.author is correct or constraints.admin === true
          context('when idea id exists', function () {
            it('should return a promise, create proper changes in database and fulfill the promise', function () {
              return expect(idea.removeComment(existentComments[0].id, {author: existentComments[0].creator, id: existentIdea.id})).to.eventually.be.fulfilled;
            });
          });

          context('when idea id doesn\'t exist', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(idea.removeComment(existentComments[0].id, {id: '1123', author: existentComments[0].creator})).to.eventually.be.rejectedWith('404');
            });
          });

          context('when idea id not specified in constraints', function () {
            it('TODO!!');
          });
        });

        context('when user is admin', function () {
          it('should make changes to database, return a promise and resolve it', function () {
            return expect(idea.removeComment(existentComments[0].id, {admin: true})).to.eventually.be.fulfilled;
          });
        });

        context('when user is not the author', function () {
          it('should return a promise and reject it with 401');
        });
      });

      context('when the comment doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.removeComment('asdf1234', {author: 'test1', id: existentIdea.id})).to.eventually.be.rejectedWith('404');
        });

        it('(admin) should return a promise and reject it with 404 code', function () {
          return expect(idea.removeComment('asdf1234', {admin: true})).to.eventually.be.rejectedWith('404');
        });
      });
    });
  });

  describe('tag functions', function () {
    var existentTag = 'test-tag-1';
    var nonexistentTag = 'nonexistent-tag-002579635';
    var addedTag = 'test-tag-2';
    var addedTag2 = 'test-tag-3';
    var addedTags = [addedTag, addedTag2];
    var user = 'test1';
    var taggedId;
    //id of the tagged idea

    var taggedIdea = {
      name: 'tagged idea name',
      description: 'tagged idea description',
      creator: user,
      created: Date.now()
    };

    //creating existent tag connection
    beforeEach(function (done) {
      return idea.create(taggedIdea)
        .then(function (id) {
          taggedId = id.id;
          return Promise.all([
            idea.addTag(taggedId, addedTags[0], user),
            idea.addTag(taggedId, addedTags[1], user)
          ]);
        })
        .then(function () {
          done();
        }, done);
    });

    //cleaning the mess
    afterEach(function(done) {
      db.query('FOR ct IN ideaTag REMOVE ct IN ideaTag')
        .then(function () {
          done();
        }, done);
    });

    describe('addTag(id, tagname, username)', function () {
      context('when idea exists', function () {
        context('when user has rights to add tag', function () {
          context('when tag exists', function () {
            context('when idea is already tagged with this tag', function () {
              it('should return a promise and reject it with 409 code', function () {
                return expect(idea.addTag(taggedId, addedTag, user)).to.eventually.be.rejectedWith('409');
              });
            });

            context('when idea was not tagged yet', function () {
              it('should return a promise, create proper changes in database and fulfill the promise', function () {
                return expect(idea.addTag(existentId, existentTag, user)).to.eventually.be.fulfilled;
              });
            });
          });

          context('when tag doesn\'t exist', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(idea.addTag(existentId, nonexistentTag, user)).to.eventually.be.rejectedWith('404');
            });
          });
        });

        context('when user doesn\'t have rights to add tag', function () {
          it('should return a promise and reject it with 401'); // should be taken care of on higher level
        });
      });

      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.addTag(nonexistentId, existentTag, user)).to.eventually.be.rejectedWith('404');
        });
      });
    });

    describe('removeTag', function () {
      context('when idea exists', function () {
        context('when user has rights to remove tag', function () {
          context('when tag exists', function () {
            context('when idea is not tagged with this tag', function () {
              it('should return a promise and reject it with 404 code', function () {
                  return expect(idea.removeTag(existentId, existentTag)).to.eventually.be.rejectedWith('404');
              });
            });

            context('when idea is tagged', function () {
              it('should return a promise, create proper changes in database and fulfill the promise', function () {
                return expect(idea.removeTag(taggedId, addedTag)).to.eventually.be.fulfilled;
              });
            });
          });

          context('when tag doesn\'t exist', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(idea.removeTag(taggedId, nonexistentTag)).to.eventually.be.rejectedWith('404');
            });
          });
        });

        context('when user doesn\'t have rights to remove tag', function () {
          it('should return a promise and reject it with 401');
        });
      });

      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.removeTag(nonexistentId, existentTag)).to.eventually.be.rejectedWith('404');
        });
      });
    });

    //this function should read tags of a idea
    describe('tags(id)', function () {
      context('when idea exists', function () {
        it('should return a promise and resolve it with an array of all idea tags (empty)', function () {
          return expect(idea.tags(existentId)).to.eventually.deep.equal([]);
        });

        it('should return a promise and resolve it with an array of all idea tags (some tags)', function (done) {
          return idea.tags(taggedId)
            .then(function (tags) {
              expect(tags).to.include.a.thing.that.has.property('name', 'test-tag-2');
              expect(tags).to.include.a.thing.that.has.property('name', 'test-tag-3');
            })
            .then(done, done);
        });
      });

      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.tags(nonexistentId)).to.eventually.be.rejectedWith('404');
        });
      });
    });

    describe('readIdeasByTags(array tags, ?username)', function () {
      var username = 'test1';
      var username2 = 'test4';
      var username3 = 'test5';
      var ideaTags = [
        {name: 'idea0', description: 'description', id: null, tags: ['test-tag-2', 'music']},
        {name: 'idea1', description: 'description', id: null, tags: ['art', 'test-tag-1', 'test-tag-2']},
        {name: 'idea2', description: 'description', id: null, tags: ['music', 'test-tag-2']},
        {name: 'idea3', description: 'description', id: null, tags: ['test-tag-1', 'travel', 'busking']},
        {name: 'idea4', description: 'description', id: null, tags: ['test-tag-1', 'test-tag-2', 'travel', 'busking']},
        {name: 'idea5', description: 'description', id: null, tags: ['art']}
      ];
      //create idea
      beforeEach(function(done) {
        var dpromises = [];
        for(let dt of ideaTags) {
          dpromises.push(idea.create({name: dt.name, description: dt.description, created: Date.now(), creator: username}));
        }
        Promise.all(dpromises)
          .then(function (objArray) {
            for(let i = 0, len = objArray.length; i<len; i++){
              ideaTags[i].id = objArray[i].id;
            }

            var exePromises = [];
            for(let dt of ideaTags) {
              for(let tg of dt.tags) {
                exePromises.push(idea.addTag(dt.id, tg, username2));
              }
            }

            exePromises.push(idea.hide(ideaTags[0].id, username3));
            exePromises.push(idea.hide(ideaTags[2].id, username3));
            exePromises.push(idea.follow(ideaTags[1].id, username3));
            
            return Promise.all(exePromises);
          })
          .then(function () {})
          .then(done, done);
      });

      afterEach(function(done) {
        db.query('FOR ufc IN userFollowIdea REMOVE ufc IN userFollowIdea')
          .then(function () {
            done();
          }, done);
      });

      it('when tag array is empty: should return a proper array of ideas found: []', function () {
        return expect(idea.readIdeasByTags([])).to.eventually.be.deep.equal([]);
      });

      it('when tag array contains only non-existent tags should return a proper array of ideas found: []', function () {
        return expect(idea.readIdeasByTags(['non-existent-tag'])).to.eventually.be.deep.equal([]);
      });

      it('when tag array contains valid tags: should return a proper array of ideas found: [{idea: {...}, tags: [...]}, {...}]', function (done) {
        return idea.readIdeasByTags(['test-tag-1'])
          .then(function (finds) {
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea1');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea3');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea4');

            expect(finds).to.not.include.a.thing.that.has.a.deep.property('idea.name', 'idea0');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('idea.name', 'idea2');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('idea.name', 'idea5');
          })
          .then(done, done);
      });

      it('when tag array contains more valid tags: should return a proper array of ideas found: [{idea: {...}, tags: [...]}, {...}]', function (done) {
        return idea.readIdeasByTags(['test-tag-2', 'travel', 'busking'])
          .then(function (finds) {
            expect(finds[0]).to.have.a.deep.property('idea.name', 'idea4');
            expect(finds[0].tagno).to.deep.equal(3);

            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea0');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea1');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea2');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea3');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea4');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('idea.name', 'idea5');
          })
          .then(done, done);
      });

      it('when tag array contains more valid tags and username: should return a proper array of ideas found: [{idea: {...}, tags: [...]}, {...}], and hidden ideas not included', function (done) {
        return idea.readIdeasByTags(['test-tag-2', 'travel', 'busking'], username3)
          .then(function (finds) {
            expect(finds[0]).to.have.a.deep.property('idea.name', 'idea4');
            expect(finds[0].tagno).to.deep.equal(3);

            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea1');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea3');
            expect(finds).to.include.a.thing.that.has.a.deep.property('idea.name', 'idea4');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('idea.name', 'idea0');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('idea.name', 'idea2');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('idea.name', 'idea5');
          })
          .then(done, done);
      });
    });
  });


  context('follow/hide functions', function () {
    var username = 'test1';
    var nonexistentUsername = 'user-12347044107675942';

    afterEach(function(done) {
      db.query('FOR dt IN ideaTag REMOVE dt IN ideaTag')
        .then(function () {
          done();
        }, done);
    });

    afterEach(function(done) {
      db.query('FOR ufd IN userFollowIdea REMOVE ufd IN userFollowIdea')
        .then(function () {
          done();
        }, done);
    });

    describe('follow(id, username)', function () {
      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.follow(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when idea exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(idea.follow(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user is already following', function () {
            it('should return a promise and reject it with 409 code', function (done) {
              return idea.follow(existentId, username)
                .then(function () {
                  return expect(idea.follow(existentId, username)).to.be.eventually.rejectedWith('409');
                })
                .then(done, done);
            });
          });

          context('when user is not following yet', function () {
            it('should insert follow to the database and return a promise and resolve it with 201 code (created)', function () {
              return expect(idea.follow(existentId, username)).to.eventually.equal('201');
            });
          });

          context('when user has the idea hidden', function () {
            it('should update hidden > follows in the database and return a promise and resolve it with 200 code (OK)', function (done) {
              return idea.follow(existentId, username, true)
                .then(function () {
                  return expect(idea.follow(existentId, username)).to.eventually.equal('200');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });

    describe('hide', function () {
      var username = 'test1';
      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.hide(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });
      context('when idea exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(idea.hide(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when idea is already hidden', function () {
            it('should return a promise and reject it with 409 code', function (done) {
              return idea.hide(existentId, username)
                .then(function (r) {
                  return expect(idea.hide(existentId, username)).to.be.eventually.rejectedWith('409');
                })
                .then(done, done);
            });
          });

          context('when idea is not hidden yet', function () {
            it('should insert hide to the database and return a promise and resolve it with 201 code (created)', function () {
              return expect(idea.hide(existentId, username)).to.eventually.equal('201');
            });
          });
          context('when user follows the idea', function () {
            it('should update follows > hidden in the database and return a promise and resolve it with 200 code (OK)', function (done) {
              return idea.follow(existentId, username)
                .then(function () {
                  return expect(idea.hide(existentId, username)).to.eventually.equal('200');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });

    //what ideas is user following
    describe('following(username)', function () {
      //create some ideas
      var existentIds = [];
      var names = ['idea0', 'idea1', 'idea2', 'idea3'];

      beforeEach(function(done) {
        var dpromises = [];
        for(let i = 0, len = names.length; i < len; i++) {
          dpromises[i] = idea.create({name: names[i], description: 'description', created: Date.now(), creator: username});
        }

        Promise.all(dpromises)
          .then(function (objArray) {
            for(let i = 0, len = objArray.length; i<len; i++){
              existentIds[i] = objArray[i].id;
            }
          })
          .then(done, done);
      });
      //END create some ideas

      context('when user exists', function () {
        it('should return a promise and resolve it with an array of ideas user follows: []', function () {
          return expect(idea.following(username)).to.eventually.deep.equal([]);
        });

        it('should return a promise and resolve it with an array of ideas user follows: [idea0, idea1, idea3]', function (done) {
          Promise.all([
            idea.follow(existentIds[0], username),
            idea.follow(existentIds[1], username),
            idea.follow(existentIds[3], username)
          ])
            .then(function () {
              return idea.following(username);
            })
            .then(function (ideas) {
              expect(ideas).to.include.a.thing.that.has.property('name', 'idea0');
              expect(ideas).to.include.a.thing.that.has.property('name', 'idea1');
              expect(ideas).to.include.a.thing.that.has.property('name', 'idea3');
            })
            .then(done, done);
        });
      });

      context('when user doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.following('nonexistent-user')).to.eventually.be.rejectedWith('404');
        });
      });
    });

    //does user follow a idea? bool.
    describe('followingUser(id, username)', function () {
      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.followingUser(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when idea exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(idea.followingUser(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user follows the idea', function () {
            it('should return a promise and resove it with true', function () {
              return expect(idea.follow(existentId, username)
                  .then(function () {
                    return idea.followingUser(existentId, username)
                  })).to.eventually.deep.equal(true);
            });
          });

          context('when user doesn\'t follow the idea', function () {
            it('should return a promise and resove it with false', function () {
              return expect(idea.followingUser(existentId, username)).to.eventually.deep.equal(false);
            });
          });
        });
      });
    });

    describe('followers(id)', function () {
      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.followers(nonexistentId)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when idea exists', function () {
        it('should return a promise and resolve it with []', function () {
          return expect(idea.followers(existentId)).to.eventually.deep.equal([]);
        });

        it('should return a promise and resolve it with [user, user, user]', function (done) {
          Promise.all([
            idea.follow(existentId, 'test1'),
            idea.follow(existentId, 'test4'),
            idea.follow(existentId, 'test5'),
            idea.hide(existentId, 'test6')
          ])
            .then(function () {
              return idea.followers(existentId);
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
      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.unfollow(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when idea exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(idea.unfollow(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user is following', function () {
            it('should remove the follow from database, return a promise and resolve it', function (done) {
              return idea.follow(existentId, username)
                .then(function () {
                  return expect(idea.unfollow(existentId, username)).to.eventually.be.fulfilled;
                })
                .then(function () {done();}, done);
            });
          });

          context('when user is not following', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(idea.unfollow(existentId, username)).to.eventually.be.rejectedWith('404');
            });
          });

          context('when user has the idea hidden', function () {
            it('should return a promise and reject it with 404 code', function (done) {
              return idea.follow(existentId, username, true)
                .then(function () {
                  return expect(idea.unfollow(existentId, username)).to.eventually.be.rejectedWith('404');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });

    describe('unhide', function () {
      context('when idea doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(idea.unhide(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when idea exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(idea.unhide(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user has the idea hidden', function () {
            it('should remove the hide from database, return a promise and resolve it', function (done) {
              return idea.hide(existentId, username)
                .then(function () {
                  return expect(idea.unhide(existentId, username)).to.eventually.be.fulfilled;
                })
                .then(function () {done();}, done);
            });
          });

          context('when user has not the discussaion hidden', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(idea.unhide(existentId, username)).to.eventually.be.rejectedWith('404');
            });
          });

          context('when user follows the idea', function () {
            it('should return a promise and reject it with 404 code', function (done) {
              return idea.follow(existentId, username)
                .then(function () {
                  return expect(idea.unhide(existentId, username)).to.eventually.be.rejectedWith('404');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });
  });

});
