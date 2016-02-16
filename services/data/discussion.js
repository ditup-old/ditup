'use strict';


module.exports = function (db) {
  var discussion = {};
  
  discussion.create = function (dscn) {
    
    var isDataComplete = !!dscn.topic && !!dscn.creator;

    if(!isDataComplete) {
      return Promise.reject('incomplete data');
    }
    else {
      var query = 'FOR u IN users FILTER u.username == @creator INSERT {topic: @topic, creator: u._id, created: @created, posts: []} IN discussions RETURN NEW._key';
      var params = {topic: dscn.topic, creator: dscn.creator, created: dscn.created || Date.now()};

      return db.query(query, params)
        .then(function (cursor) {
          var writes = cursor.extra.stats.writesExecuted;
          if (writes === 0) throw new Error(404);
          if (writes > 1) throw new Error('more than 1 discussion created. this should never happen');

          return cursor.all();
        })
        .then(function (arrayId) {
          return {id: arrayId[0]};
        })
        .then(null, function (err) {
          return Promise.reject(err);
        });
    }
  };

  discussion.read = function (id) {
    var query = 'FOR d IN discussions FILTER d._key == @id RETURN d';
    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (discs) {
        if(discs.length === 1) {
          return discs[0];
        }
        else if(discs.length === 0) {
          throw new Error(404);
        }
        else {
          throw new Error('duplicate discussion id. this should never happen.');
        }
      });
  };

  discussion.delete = function (id) {
    var query = 'FOR d IN discussions FILTER d._key == @id REMOVE d IN discussions';
    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) throw new Error(404);
        else if (writes === 1) return {success: true}
        else throw new Error('problems with removing tag (this should never happen)');
      });
  };

  discussion.addPost = function (id, post) {
    var query = `FOR d in discussions FILTER d._key == @id
        FOR u IN users FILTER u.username == @creator
            LET posts = (PUSH(d.posts, {text: @text, created: @created, creator: u._id}, false))
            UPDATE d WITH {posts: posts} IN discussions
            RETURN LENGTH(NEW.posts)-1`;
    var params = {id: id, creator: post.creator, created: post.created || Date.now(), text: post.text};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) throw new Error(404);
        if (writes > 1) throw new Error('more than 1 discussion updated. this should never happen.');
        return cursor.all();
      })
      .then(function (updated) {
        return {id: updated[0]};
      });
  }
  
  discussion.updatePost = function (id, post, editable) {
    editable = editable || false;

    if(!post.user || !post.text || !post.index || !id ) return Promise.reject(400);
    //find out if user can edit the post
    var canEdit;
    //if she has special rights, can edit.
    if(editable === true) canEdit = Promise.resolve('admin');
    else {
        
      //this query should resolve if user & post creator match.
      //else it should return promise and reject it(with some error codes).
      var canEditQuery = `FOR d IN discussions FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
          RETURN TO_BOOL(NTH(d.posts, @index)) ? ( u._id == d.posts[@index].creator ? true : 401) : 404
        `;
      var canEditParams = {id: id, index: post.index, username: post.user};
      canEdit = db.query(canEditQuery, canEditParams)
        .then(function (cursor) {
          return cursor.all();
        })
        .then(function (can) {
          //if discussion or user was not found
          if(can.length === 0) throw new Error(404);
          if(can.length > 1) throw new Error(500);
          if(can[0] === true) return 'user';
          if(can[0] === 401) throw new Error(401);
          if(can[0] === 404) throw new Error(404);
          throw new Error('uncaught');
        });
    }

    return canEdit
      .then(function () {
        var query = `FOR d IN discussions FILTER d._key == @id
        UPDATE d WITH {
            posts: UNION(
                SLICE(d.posts, 0, @index),
                [MERGE(d.posts[@index], {text: @text, updated: @updated})],
                SLICE(d.posts, @index+1)
            )
        } IN discussions
        RETURN NEW`;
        var params = {id: id, text: post.text, /*user: post.user, */updated: post.updated || Date.now(), index: post.index };
        return db.query(query, params);
    });
  };

  return discussion;
};
