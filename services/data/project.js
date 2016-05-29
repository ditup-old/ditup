'use strict';

var proto = require('./proto');


module.exports = function (db) {
  var project = {};

  project.create = proto.create(['name', 'description', 'join', 'join_info'], 'projects', db);

  project.read = function (id) {
    var query = `FOR d IN projects FILTER d._key == @id
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
          throw new Error('duplicate project id. this should never happen.');
        }
      });
  };

  project.update = function () {
    throw new Error('TODO!');
  }; //TODO

  project.delete = proto.delete('projects', db);

  project.addTag = proto.addTag('projects', db);
  project.removeTag = proto.removeTag('projects', db);
  project.tags = proto.tags('projects', db);

  //comment
  project.addComment = proto.addComment('projects', db);

  project.readComment = function () {
    throw new Error('TODO!');
  };

  project.readComments = proto.readComments('projects', db);
  project.updateComment;
  project.removeComment = proto.removeComment('projects', db);

  project.follow = proto.follow('projects', db);
  project.hide = proto.hide('projects', db);
  project.following = proto.following('projects', db);
  project.followingUser = proto.followingUser('projects', db);
  project.followers = proto.followers('projects', db);
  project.countFollowers = proto.countFollowers('projects', db);
  project.unfollow = proto.unfollow('projects', db);
  project.unhide = proto.unhide('projects', db);
  project.readProjectsByTags = proto.readCollectionsByTags(['name', 'description'], 'projects', db);

  //********************membership functions
  project.addMember = function (id, username, relation) {
    let allowedStates = ['joining', 'invited', 'member'];
    if(allowedStates.indexOf(relation)<0) return Promise.reject('400');

    let query = `FOR p IN projects FILTER p._key == @id
      FOR u IN users FILTER u.username == @username
        INSERT {
          _from: p._id,
          _to: u._id,
          unique: CONCAT(p._id, '-', u._id),
          relation: @relation,
          created: @created
        } IN projectMember`;
    let params = {
      id: id,
      username: username,
      relation: relation,
      created: Date.now()
    };

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error('404');
        if(writes > 1) throw new Error('more than one tag added. This should never happen.');
      })
      .then(null, function (err) {
        if(err.code === 409) throw new Error('409');
        throw err;
      });
  }

  //********************END

  return project;
};
