'use strict';

var proto = require('./proto');


module.exports = function (db) {
  var idea = {};

  idea.create = proto.create(['name', 'description'], 'ideas', db);

  idea.read = proto.read('ideas', db);;

  idea.update = function () {
    throw new Error('TODO!');
  }; //TODO

  idea.updateField = proto.updateField('ideas', db);
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
//  idea.hide = proto.hide('ideas', db);
  idea.following = proto.following('ideas', db);
  idea.followingUser = proto.followingUser('ideas', db);
  idea.followers = proto.followers('ideas', db);
  idea.countFollowers = proto.countFollowers('ideas', db);
  idea.unfollow = proto.unfollow('ideas', db);
//  idea.unhide = proto.unhide('ideas', db);
  idea.readIdeasByTags = proto.readCollectionsByTags(['name', 'description'], 'ideas', db);

  idea.popular = proto.popular('ideas', db);
  idea.newest = proto.newest('ideas', db);
  idea.random = proto.random('ideas', db);

  idea.ideasByTagsOfUser = proto.collectionsByTagsOfUser('ideas', db);
  return idea;
};
