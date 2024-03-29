'use strict';

var proto = require('./proto');


module.exports = function (db) {
  var challenge = {};

  challenge.create = proto.create(['name', 'description'], 'challenges', db);

  challenge.read = proto.read('challenges', db);

  challenge.update = function () {
    throw new Error('TODO');
  };

  challenge.updateField = proto.updateField('challenges', db);

  challenge.delete = proto.delete('challenges', db);

  challenge.addTag = proto.addTag('challenges', db);
  challenge.removeTag = proto.removeTag('challenges', db);
  challenge.tags = proto.tags('challenges', db);

  //comment
  challenge.addComment = proto.addComment('challenges', db);

  challenge.readComment = function () {
    throw new Error('TODO!');
  };

  challenge.readComments = proto.readComments('challenges', db);
  challenge.updateComment;
  challenge.removeComment = proto.removeComment('challenges', db);

  challenge.follow = proto.follow('challenges', db);
//  challenge.hide = proto.hide('challenges', db);
  challenge.following = proto.following('challenges', db);
  challenge.followingUser = proto.followingUser('challenges', db);
  challenge.followers = proto.followers('challenges', db);
  challenge.countFollowers = proto.countFollowers('challenges', db);
  challenge.unfollow = proto.unfollow('challenges', db);
//  challenge.unhide = proto.unhide('challenges', db);
  challenge.readChallengesByTags = proto.readCollectionsByTags(['name', 'description'], 'challenges', db);

  challenge.popular = proto.popular('challenges', db);
  challenge.newest = proto.newest('challenges', db);
  challenge.random = proto.random('challenges', db);
  
  challenge.challengesByTagsOfUser = proto.collectionsByTagsOfUser('challenges', db);

  return challenge;
};
