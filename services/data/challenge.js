'use strict';

var proto = require('./proto');


module.exports = function (db) {
  var challenge = {};

  challenge.create = proto.create(['name', 'description'], 'challenges', db);

  challenge.read = function (id) {
    var query = `FOR d IN challenges FILTER d._key == @id
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
          throw new Error('duplicate challenge id. this should never happen.');
        }
      });
  };

  challenge.update; //TODO

  challenge.delete = proto.delete('challenges', db);

  challenge.addTag = proto.addTag('challenges', db);
  challenge.removeTag = proto.removeTag('challenges', db);
  challenge.tags = proto.tags('challenges', db);

  //comment
  challenge.addComment = function (id, comment, username) {
    //comment = {text: ''}, username = username, id = challenge id (string)
    //username is username of author
    //
    var query = `FOR c IN challenges FILTER c._key == @id
      FOR u IN users FILTER u.username == @username
        INSERT {_from: c._id, _to: u._id, text: @text, created: @created} INTO challengeCommentAuthor
        RETURN NEW`;
    var params = {id: id, username: username, text: comment.text, created: Date.now()};
    
    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error(404);
        if(writes > 1) throw new Error('more than one comment added. This should never happen.');

        return cursor.all();
      })
      .then(function (arrayId) {
        return {id: arrayId[0]._key};
      })
      .then(null, function (err) {
        if(err.code === 409) throw new Error(409);
        throw err;
      });
    
  };

  challenge.readComments =  function (id, params) {
    var query = `
      LET col = (FOR c IN challenges FILTER c._key == @id RETURN c)
      LET out = (FOR c IN col
        FOR cca IN challengeCommentAuthor FILTER cca._from == c._id
          FOR u IN users FILTER u._id == cca._to
            SORT cca.created DESC
            RETURN MERGE(cca, {author: u}, {id: cca._key}))
      RETURN LENGTH(col) == 0 ? 404 : out
    `;
    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (out) {
        if(out[0] == '404') throw new Error('404');
        console.log(out);
        return out[0];
      });
  };

  challenge.updateComment;

  challenge.removeComment = function (commentId, constraints) {
    //options
    //0 - default - throws error bad data
    //1 - constraints have property id and author - make sure the comment is of that author and challenge id
    //2 - constraints have property author - make sure the comment is of that author
    //3 - constraints have property id
    //4 - constraints have property admin: true
    //

    //return this.readComments(constraints.id);

    var option = 0;

    if(constraints.author && constraints.id) {
      option = 1;
    }
    else if(constraints.author) {
      option = 2;
    }
    else if(constraints.id) {
      option = 3;
    }
    else if(constraints.admin === true) {
      option = 4;
    }

    if(option === 0) {
      return Promise.reject('400 - bad data');
    }

    var dbPromise;
    
    if(option === 1) {
      let query = `
        FOR u IN users FILTER u.username == @author
          FOR c IN challenges FILTER c._key == @id
            FOR cca IN challengeCommentAuthor FILTER cca._key == @commentId && cca._from == c._id && cca._to == u._id
              REMOVE cca IN challengeCommentAuthor`;
      let params = {author: constraints.author, id: constraints.id, commentId: commentId};
      dbPromise = db.query(query, params);
    }

    if(option === 2) {
      return Promise.reject('TODO');
    }

    if(option === 3) {
      return Promise.reject('TODO');
    }

    if(option === 4) {
      let query = `
        FOR cca IN challengeCommentAuthor FILTER cca._key == @commentId
          REMOVE cca IN challengeCommentAuthor`;
      let params = {commentId: commentId};
      dbPromise = db.query(query, params);
    }

    return dbPromise
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes == 0) throw new Error('404');
        if(writes > 1) throw new Error('more than 1 comment removed. this should never happen');
      });
  };

  challenge.follow = proto.follow('challenges', db);
  challenge.hide = proto.hide('challenges', db);
  challenge.following = proto.following('challenges', db);
  challenge.followingUser = proto.followingUser('challenges', db);
  challenge.followers = proto.followers('challenges', db);
  challenge.unfollow = proto.unfollow('challenges', db);
  challenge.unhide = proto.unhide('challenges', db);
  challenge.readChallengesByTags = proto.readCollectionsByTags(['name', 'description'], 'challenges', db);

  return challenge;
};
