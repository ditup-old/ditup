'use strict';

var proto = require('./proto');


module.exports = function (db) {
  var idea = {};

  idea.create = proto.create(['name', 'description'], 'ideas', db);

  idea.read = function (id) {
    var query = `FOR d IN ideas FILTER d._key == @id
      LET creator = (FOR u IN users FILTER u._id == d.creator RETURN u)
      FOR c IN creator
        RETURN MERGE(d, {creator: {username: c.username}})`;

    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (discs) {
        if(discs.length === 1) {
          return discs[0];        }
        else if(discs.length === 0) {
          throw new Error(404);
        }
        else {
          throw new Error('duplicate idea id. this should never happen.');
        }
      });
  };

  idea.update = function () {
    throw new Error('TODO!');
  }; //TODO

  idea.delete = proto.delete('ideas', db);

  idea.addTag = proto.addTag('ideas', db);
  idea.removeTag = proto.removeTag('ideas', db);
  idea.tags = proto.tags('ideas', db);

  //comment
  idea.addComment = proto.addComment('ideas', db);

  idea.readComment = function () {
    throw new Error('TODO!');
  };

  idea.readComments = proto.readComments('ideas', db);
  idea.updateComment;
  idea.removeComment = proto.removeComment('ideas', db);

  idea.follow = proto.follow('ideas', db);
  idea.hide = proto.hide('ideas', db);
  idea.following = proto.following('ideas', db);
  idea.followingUser = proto.followingUser('ideas', db);
  idea.followers = proto.followers('ideas', db);
  idea.unfollow = proto.unfollow('ideas', db);
  idea.unhide = proto.unhide('ideas', db);
  idea.readIdeasByTags = proto.readCollectionsByTags(['name', 'description'], 'ideas', db);

  idea.popular = proto.popular('ideas', db);
  idea.newest = proto.newest('ideas', db);
  return idea;
};
