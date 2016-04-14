'use strict';

var Database = require('arangojs');
var config = require('../../services/db-config');

var chai = require('chai');
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

var existentChallenge = {
  name: 'existent challenge name',
  description: 'existent challenge description',
  creator: 'test1',
  created: Date.now()
};

describe('data/challenge', function () {

  //removing all challenges from the database after each test
  var existentId;
  var nonexistentId = '1111111111111111111';

  beforeEach(function(done) {
    challenge.create(existentChallenge)
      .then(function (obj) {
        existentId = obj.id;
      })
      .then(done, done);
  });

  afterEach(function (done) {
    return db.query('FOR c IN challenges REMOVE c IN challenges', {}).then(function () {done();}, done);
  });

  describe('create(data)', function () {
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

  describe('read(id)', function () {
    context('when challenge with :id exists', function () {
      it('should return the challenge object', function () {
        return Promise.all([
          expect(challenge.read(existentId)).to.eventually.be.fulfilled,
          expect(challenge.read(existentId)).to.eventually.have.property('name'),
          expect(challenge.read(existentId)).to.eventually.have.property('description'),
          expect(challenge.read(existentId)).to.eventually.have.property('creator'),
          expect(challenge.read(existentId)).to.eventually.have.property('created')
        ]);
      });
    });

    context('when challenge with :id doesn\'t exist', function () {
      it('should return a promise and reject it with a proper error message', function () {
        return Promise.all([
          expect(challenge.read(nonexistentId)).to.eventually.be.rejectedWith('404')
        ]);
      });
    });
  });

  describe('update(id, data)', function () {
    it('TODO!');
  });

  describe('delete(id)', function () {
    context('when challenge with :id exists', function () {
      it('should delete the challenge from the database and be fulfilled', function () {
        return expect(challenge.delete(existentId)).to.eventually.be.fulfilled;
      });
    });
    context('when challenge with :id doesn\'t exist', function () {
      it('should return a promise and reject it with a proper error message', function () {
        return expect(challenge.delete(nonexistentId)).to.eventually.be.rejectedWith('404');
      });
    });
  });

  describe('addComment(id, data)', function () {});
  describe('readComment(commentId)', function () {});
  describe('readComments(id, specifics)', function () {});
  describe('updateComment(commentId, data)', function () {});
  describe('deleteComment(commentId)', function () {});

  describe('tag functions', function () {
    var existentTag = 'test-tag-1';
    var nonexistentTag = 'nonexistent-tag-002579635';
    var addedTag = 'test-tag-2';
    var addedTag2 = 'test-tag-3';
    var addedTags = [addedTag, addedTag2];
    var user = 'test1';
    var taggedId;
    //id of the tagged challenge

    var taggedChallenge = {
      name: 'tagged challenge name',
      description: 'tagged challenge description',
      creator: user,
      created: Date.now()
    };

    //creating existent tag connection
    beforeEach(function (done) {
      return challenge.create(taggedChallenge)
        .then(function (id) {
          taggedId = id.id;
          return Promise.all([
            challenge.addTag(taggedId, addedTags[0], user),
            challenge.addTag(taggedId, addedTags[1], user)
          ]);
        })
        .then(function () {
          done();
        }, done);
    });

    //cleaning the mess
    afterEach(function(done) {
      db.query('FOR ct IN challengeTag REMOVE ct IN challengeTag')
        .then(function () {
          done();
        }, done);
    });

    describe('addTag(id, tagname, username)', function () {
      context('when challenge exists', function () {
        context('when user has rights to add tag', function () {
          context('when tag exists', function () {
            context('when challenge is already tagged with this tag', function () {
              it('should return a promise and reject it with 409 code', function () {
                return expect(challenge.addTag(taggedId, addedTag, user)).to.eventually.be.rejectedWith('409');
              });
            });

            context('when challenge was not tagged yet', function () {
              it('should return a promise, create proper changes in database and fulfill the promise', function () {
                return expect(challenge.addTag(existentId, existentTag, user)).to.eventually.be.fulfilled;
              });
            });
          });

          context('when tag doesn\'t exist', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(challenge.addTag(existentId, nonexistentTag, user)).to.eventually.be.rejectedWith('404');
            });
          });
        });

        context('when user doesn\'t have rights to add tag', function () {
          it('should return a promise and reject it with 401'); // should be taken care of on higher level
        });
      });

      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.addTag(nonexistentId, existentTag, user)).to.eventually.be.rejectedWith('404');
        });
      });
    });

    describe('removeTag', function () {
      context('when challenge exists', function () {
        context('when user has rights to remove tag', function () {
          context('when tag exists', function () {
            context('when challenge is not tagged with this tag', function () {
              it('should return a promise and reject it with 404 code', function () {
                  return expect(challenge.removeTag(existentId, existentTag)).to.eventually.be.rejectedWith('404');
              });
            });

            context('when challenge is tagged', function () {
              it('should return a promise, create proper changes in database and fulfill the promise', function () {
                return expect(challenge.removeTag(taggedId, addedTag)).to.eventually.be.fulfilled;
              });
            });
          });

          context('when tag doesn\'t exist', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(challenge.removeTag(taggedId, nonexistentTag)).to.eventually.be.rejectedWith('404');
            });
          });
        });

        context('when user doesn\'t have rights to remove tag', function () {
          it('should return a promise and reject it with 401');
        });
      });

      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.removeTag(nonexistentId, existentTag)).to.eventually.be.rejectedWith('404');
        });
      });
    });

    //this function should read tags of a challenge
    describe('tags(id)', function () {
      context('when challenge exists', function () {
        it('should return a promise and resolve it with an array of all challenge tags (empty)', function () {
          return expect(challenge.tags(existentId)).to.eventually.deep.equal([]);
        });

        it('should return a promise and resolve it with an array of all challenge tags (some tags)', function (done) {
          return challenge.tags(taggedId)
            .then(function (tags) {
              expect(tags).to.include.a.thing.that.has.property('name', 'test-tag-2');
              expect(tags).to.include.a.thing.that.has.property('name', 'test-tag-3');
            })
            .then(done, done);
        });
      });

      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.tags(nonexistentId)).to.eventually.be.rejectedWith('404');
        });
      });
    });

    describe('readChallengesByTags(array tags, ?username)', function () {
      var username = 'test1';
      var username2 = 'test4';
      var username3 = 'test5';
      var challengeTags = [
        {name: 'challenge0', description: 'description', id: null, tags: ['test-tag-2', 'music']},
        {name: 'challenge1', description: 'description', id: null, tags: ['art', 'test-tag-1', 'test-tag-2']},
        {name: 'challenge2', description: 'description', id: null, tags: ['music', 'test-tag-2']},
        {name: 'challenge3', description: 'description', id: null, tags: ['test-tag-1', 'travel', 'busking']},
        {name: 'challenge4', description: 'description', id: null, tags: ['test-tag-1', 'test-tag-2', 'travel', 'busking']},
        {name: 'challenge5', description: 'description', id: null, tags: ['art']}
      ];
      //create challenge
      beforeEach(function(done) {
        var dpromises = [];
        for(let dt of challengeTags) {
          dpromises.push(challenge.create({name: dt.name, description: dt.description, created: Date.now(), creator: username}));
        }
        Promise.all(dpromises)
          .then(function (objArray) {
            for(let i = 0, len = objArray.length; i<len; i++){
              challengeTags[i].id = objArray[i].id;
            }

            var exePromises = [];
            for(let dt of challengeTags) {
              for(let tg of dt.tags) {
                exePromises.push(challenge.addTag(dt.id, tg, username2));
              }
            }

            exePromises.push(challenge.hide(challengeTags[0].id, username3));
            exePromises.push(challenge.hide(challengeTags[2].id, username3));
            exePromises.push(challenge.follow(challengeTags[1].id, username3));
            
            return Promise.all(exePromises);
          })
          .then(function () {})
          .then(done, done);
      });

      afterEach(function(done) {
        db.query('FOR ufc IN userFollowChallenge REMOVE ufc IN userFollowChallenge')
          .then(function () {
            done();
          }, done);
      });

      it('when tag array is empty: should return a proper array of challenges found: []', function () {
        return expect(challenge.readChallengesByTags([])).to.eventually.be.deep.equal([]);
      });

      it('when tag array contains only non-existent tags should return a proper array of challenges found: []', function () {
        return expect(challenge.readChallengesByTags(['non-existent-tag'])).to.eventually.be.deep.equal([]);
      });

      it('when tag array contains valid tags: should return a proper array of challenges found: [{challenge: {...}, tags: [...]}, {...}]', function (done) {
        return challenge.readChallengesByTags(['test-tag-1'])
          .then(function (finds) {
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge1');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge3');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge4');

            expect(finds).to.not.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge0');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge2');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge5');
          })
          .then(done, done);
      });

      it('when tag array contains more valid tags: should return a proper array of challenges found: [{challenge: {...}, tags: [...]}, {...}]', function (done) {
        return challenge.readChallengesByTags(['test-tag-2', 'travel', 'busking'])
          .then(function (finds) {
            expect(finds[0]).to.have.a.deep.property('challenge.name', 'challenge4');
            expect(finds[0].tagno).to.deep.equal(3);

            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge0');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge1');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge2');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge3');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge4');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge5');
          })
          .then(done, done);
      });

      it('when tag array contains more valid tags and username: should return a proper array of challenges found: [{challenge: {...}, tags: [...]}, {...}], and hidden challenges not included', function (done) {
        return challenge.readChallengesByTags(['test-tag-2', 'travel', 'busking'], username3)
          .then(function (finds) {
            expect(finds[0]).to.have.a.deep.property('challenge.name', 'challenge4');
            expect(finds[0].tagno).to.deep.equal(3);

            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge1');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge3');
            expect(finds).to.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge4');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge0');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge2');
            expect(finds).to.not.include.a.thing.that.has.a.deep.property('challenge.name', 'challenge5');
          })
          .then(done, done);
      });
    });
  });


  context('follow/hide functions', function () {
    var username = 'test1';
    var nonexistentUsername = 'user-12347044107675942';

    afterEach(function(done) {
      db.query('FOR dt IN challengeTag REMOVE dt IN challengeTag')
        .then(function () {
          done();
        }, done);
    });

    afterEach(function(done) {
      db.query('FOR ufd IN userFollowChallenge REMOVE ufd IN userFollowChallenge')
        .then(function () {
          done();
        }, done);
    });

    describe('follow(id, username)', function () {
      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.follow(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when challenge exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(challenge.follow(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user is already following', function () {
            it('should return a promise and reject it with 409 code', function (done) {
              return challenge.follow(existentId, username)
                .then(function () {
                  return expect(challenge.follow(existentId, username)).to.be.eventually.rejectedWith('409');
                })
                .then(done, done);
            });
          });

          context('when user is not following yet', function () {
            it('should insert follow to the database and return a promise and resolve it with 201 code (created)', function () {
              return expect(challenge.follow(existentId, username)).to.eventually.equal('201');
            });
          });

          context('when user has the challenge hidden', function () {
            it('should update hidden > follows in the database and return a promise and resolve it with 200 code (OK)', function (done) {
              return challenge.follow(existentId, username, true)
                .then(function () {
                  return expect(challenge.follow(existentId, username)).to.eventually.equal('200');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });

    describe('hide', function () {
      var username = 'test1';
      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.hide(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });
      context('when challenge exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(challenge.hide(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when challenge is already hidden', function () {
            it('should return a promise and reject it with 409 code', function (done) {
              return challenge.hide(existentId, username)
                .then(function (r) {
                  return expect(challenge.hide(existentId, username)).to.be.eventually.rejectedWith('409');
                })
                .then(done, done);
            });
          });

          context('when challenge is not hidden yet', function () {
            it('should insert hide to the database and return a promise and resolve it with 201 code (created)', function () {
              return expect(challenge.hide(existentId, username)).to.eventually.equal('201');
            });
          });
          context('when user follows the challenge', function () {
            it('should update follows > hidden in the database and return a promise and resolve it with 200 code (OK)', function (done) {
              return challenge.follow(existentId, username)
                .then(function () {
                  return expect(challenge.hide(existentId, username)).to.eventually.equal('200');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });

    //what challenges is user following
    describe('following(username)', function () {
      //create some challenges
      var existentIds = [];
      var names = ['challenge0', 'challenge1', 'challenge2', 'challenge3'];

      beforeEach(function(done) {
        var dpromises = [];
        for(let i = 0, len = names.length; i < len; i++) {
          dpromises[i] = challenge.create({name: names[i], description: 'description', created: Date.now(), creator: username});
        }

        Promise.all(dpromises)
          .then(function (objArray) {
            for(let i = 0, len = objArray.length; i<len; i++){
              existentIds[i] = objArray[i].id;
            }
          })
          .then(done, done);
      });
      //END create some challenges

      context('when user exists', function () {
        it('should return a promise and resolve it with an array of challenges user follows: []', function () {
          return expect(challenge.following(username)).to.eventually.deep.equal([]);
        });

        it('should return a promise and resolve it with an array of challenges user follows: [challenge0, challenge1, challenge3]', function (done) {
          Promise.all([
            challenge.follow(existentIds[0], username),
            challenge.follow(existentIds[1], username),
            challenge.follow(existentIds[3], username)
          ])
            .then(function () {
              return challenge.following(username);
            })
            .then(function (challenges) {
              expect(challenges).to.include.a.thing.that.has.property('name', 'challenge0');
              expect(challenges).to.include.a.thing.that.has.property('name', 'challenge1');
              expect(challenges).to.include.a.thing.that.has.property('name', 'challenge3');
            })
            .then(done, done);
        });
      });

      context('when user doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.following('nonexistent-user')).to.eventually.be.rejectedWith('404');
        });
      });
    });

    //does user follow a challenge? bool.
    describe('followingUser(id, username)', function () {
      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.followingUser(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when challenge exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(challenge.followingUser(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user follows the challenge', function () {
            it('should return a promise and resove it with true', function () {
              return expect(challenge.follow(existentId, username)
                  .then(function () {
                    return challenge.followingUser(existentId, username)
                  })).to.eventually.deep.equal(true);
            });
          });

          context('when user doesn\'t follow the challenge', function () {
            it('should return a promise and resove it with false', function () {
              return expect(challenge.followingUser(existentId, username)).to.eventually.deep.equal(false);
            });
          });
        });
      });
    });

    describe('followers(id)', function () {
      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.followers(nonexistentId)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when challenge exists', function () {
        it('should return a promise and resolve it with []', function () {
          return expect(challenge.followers(existentId)).to.eventually.deep.equal([]);
        });

        it('should return a promise and resolve it with [user, user, user]', function (done) {
          Promise.all([
            challenge.follow(existentId, 'test1'),
            challenge.follow(existentId, 'test4'),
            challenge.follow(existentId, 'test5'),
            challenge.hide(existentId, 'test6')
          ])
            .then(function () {
              return challenge.followers(existentId);
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
      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.unfollow(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when challenge exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(challenge.unfollow(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user is following', function () {
            it('should remove the follow from database, return a promise and resolve it', function (done) {
              return challenge.follow(existentId, username)
                .then(function () {
                  return expect(challenge.unfollow(existentId, username)).to.eventually.be.fulfilled;
                })
                .then(function () {done();}, done);
            });
          });

          context('when user is not following', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(challenge.unfollow(existentId, username)).to.eventually.be.rejectedWith('404');
            });
          });

          context('when user has the challenge hidden', function () {
            it('should return a promise and reject it with 404 code', function (done) {
              return challenge.follow(existentId, username, true)
                .then(function () {
                  return expect(challenge.unfollow(existentId, username)).to.eventually.be.rejectedWith('404');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });

    describe('unhide', function () {
      context('when challenge doesn\'t exist', function () {
        it('should return a promise and reject it with 404 code', function () {
          return expect(challenge.unhide(nonexistentId, username)).to.eventually.be.rejectedWith('404');
        });
      });

      context('when challenge exists', function () {
        context('when user doesn\'t exist', function () {
          it('should return a promise and reject it with 404 code', function () {
            return expect(challenge.unhide(existentId, nonexistentUsername)).to.eventually.be.rejectedWith('404');
          });
        });

        context('when user exists', function () {
          context('when user has the challenge hidden', function () {
            it('should remove the hide from database, return a promise and resolve it', function (done) {
              return challenge.hide(existentId, username)
                .then(function () {
                  return expect(challenge.unhide(existentId, username)).to.eventually.be.fulfilled;
                })
                .then(function () {done();}, done);
            });
          });

          context('when user has not the discussaion hidden', function () {
            it('should return a promise and reject it with 404 code', function () {
              return expect(challenge.unhide(existentId, username)).to.eventually.be.rejectedWith('404');
            });
          });

          context('when user follows the challenge', function () {
            it('should return a promise and reject it with 404 code', function (done) {
              return challenge.follow(existentId, username)
                .then(function () {
                  return expect(challenge.unhide(existentId, username)).to.eventually.be.rejectedWith('404');
                })
                .then(function () {done();}, done);
            });
          });
        });
      });
    });
  });

});
