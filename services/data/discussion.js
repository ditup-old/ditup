'use strict';

let co = require('co');

var proto = require('./proto');


module.exports = function (db) {
  var discussion = {};

  discussion.create = proto.create(['name'], 'discussions', db);
  
  discussion.read = function (id) {
    var query = `
      FOR d IN discussions FILTER d._key == @id
        LET creator = (FOR u IN users FILTER u._id == d.creator RETURN u)
        FOR c IN creator
          RETURN MERGE(d, {creator: {username: c.username}}, {id: d._key})
    `;
    var params = {id: id};

    return co(function * () {
      let cursor = yield db.query(query, params);
      let discs = yield cursor.all();

      if(discs.length === 1) {
        return discs[0];
      }
      else if(discs.length === 0) {
        let err = new Error('Not Found');
        err.status = 404;
        throw err;
      }
      else {
        throw new Error('duplicate discussion id. this should never happen.');
      }
    });
  };

  discussion.update; //TODO

  discussion.updateField = proto.updateField('discussions', db);

  discussion.delete = function (id) {
    var query = 'FOR d IN discussions FILTER d._key == @id REMOVE d IN discussions';
    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) throw new Error(404);
        else if (writes === 1) return {success: true}
        else throw new Error('problems with removing discussion (this should never happen)');
      });
  };

  discussion.addComment = proto.addComment('discussions', db);

  discussion.readComment = function () {
    throw new Error('TODO!');
  };

  discussion.readComments = proto.readComments('discussions', db);
  discussion.removeComment = proto.removeComment('discussions', db);
  discussion.updateComment = proto.updateComment('discussions', db);

  discussion.canEditComment = function () {};

  //alternative post>comment name


  discussion.addTag = proto.addTag('discussions', db);
  discussion.removeTag = proto.removeTag('discussions', db);
  discussion.tags = proto.tags('discussions', db);

  discussion.follow = proto.follow('discussions', db);
  //discussion.hide = proto.hide('discussions', db);
  discussion.unfollow = proto.unfollow('discussions', db);
  discussion.countFollowers = proto.countFollowers('discussions', db);
  //discussion.unhide = proto.unhide('discussions', db);
  discussion.following = proto.following('discussions', db);
  discussion.followingUser = proto.followingUser('discussions', db);
  discussion.followers = proto.followers('discussions', db);

  discussion.readDiscussionsByTags = function (tags, username) {
    var query = `LET output = (FOR t IN tags FILTER t.name IN @tags
          FOR dt IN discussionTag FILTER dt._to == t._id
              FOR d IN discussions FILTER d._id == dt._from
                  RETURN {discussion: d, tag: t})
      FOR pt IN output
          COLLECT ditt = pt.discussion INTO tags = {name: pt.tag.name, description: pt.tag.description}
          LET tagno = LENGTH(tags)
          SORT tagno DESC
          LET discussion = {name: ditt.name, id: ditt._key, posts: LENGTH(ditt.posts)}
          RETURN {discussion: discussion, tags: tags, tagno: tagno}`;
    var params = {tags: tags};

    if(username) {
      query = `LET output = (FOR t IN tags FILTER t.name IN @tags
            FOR dt IN discussionTag FILTER dt._to == t._id
                FOR d IN discussions FILTER d._id == dt._from
                    RETURN {discussion: d, tag: t})
        LET collected = (FOR pt IN output
            COLLECT ditt = pt.discussion INTO tags = {name: pt.tag.name, description: pt.tag.description}
            LET tagno = LENGTH(tags)
            LET discussion = {name: ditt.name, id: ditt._key, _id: ditt._id, posts: LENGTH(ditt.posts)}
            RETURN {discussion: discussion, tags: tags, tagno: tagno})
        LET hidden = (FOR u IN users FILTER u.username == @username
          FOR c IN collected
            FOR ufd IN userFollowDiscussion FILTER ufd._from == u._id && ufd._to == c.discussion._id && ufd.hide == true
              RETURN c.discussion._id)
        FOR c IN collected FILTER c.discussion._id NOT IN hidden
          SORT c.tagno DESC
          RETURN c`;
      params = {tags: tags, username: username};
    }

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (discussions) {
        return discussions;
      });
    ; 
  };

  discussion.visit = function (id, username) {
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
        FOR ufd IN userFollowDiscussion FILTER ufd._from == u._id && ufd._to == d._id && ufd.hide == false
          UPDATE ufd WITH {visited: @now} IN userFollowDiscussion RETURN NEW`;
    var params = {id: id, username: username, now: Date.now()};
    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) return false;
        if(writes === 1) return true;
        throw new Error('weird number of writes. this should never happen');
      });
  };

  discussion.lastVisit = function (id, username) {
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
        FOR ufd IN userFollowDiscussion FILTER ufd._from == u._id && ufd._to == d._id && ufd.hide == false
          RETURN ufd.visited`;
    var params = {id: id, username: username};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (_visited) {
        let l = _visited.length;
        if(l === 0) return null;
        if(l === 1) return _visited[0];
        throw new Error('this should never happen. weird number of returned values');
      });
  }

  discussion.popular = proto.popular('discussions', db);
  discussion.newest = proto.newest('discussions', db);
  discussion.random = proto.random('discussions', db);

  discussion.discussionsByTagsOfUser = proto.collectionsByTagsOfUser('discussions', db);


  return discussion;
};
