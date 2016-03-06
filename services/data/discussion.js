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
    var query = `FOR d IN discussions FILTER d._key == @id
      LET creator = (FOR u IN users FILTER u._id == d.creator RETURN u)
      //LET posts = (FOR p IN d.posts
      //  LET cr = (FOR u IN users FILTER u._id == p.creator RETURN u)
      //    RETURN MERGE(p, {creator: {username: u.username}}))
      FOR c IN creator
        //RETURN d
        RETURN MERGE(d, {creator: {username: c.username}})
        `;

    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (discs) {
        console.log(discs);
        if(discs.length === 1) {
          var result = discs[0];

          //find creators of posts
          var promises = [];
          for(let i = 0, len = result.posts.length; i<len; ++i) {
            //if post was not deleted
            if(result.posts[i]) {
              let query = 'FOR u IN users FILTER u._id == @id RETURN {username: u.username}';
              let params = {id: result.posts[i].creator};
              promises.push(db.query(query, params).then(function (cursor) {
                return cursor.all();
              }).then(function (_res) {
                var user = _res[0];
                result.posts[i].creator = user;
                return result.posts[i];
              }));
            }
            else{
              //post was deleted
              promises.push(Promise.resolve(null));
            }
          }
          return Promise.all(promises)
            .then(function (posts) {
              result.posts = posts;
              return result;
            });
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

    if(!post.user || !post.text || typeof post.index !== 'number' || !id ) return Promise.reject(400);
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

  discussion.canEditPost = function () {};

  discussion.removePost = function (id, post, editable) {
    var canEdit;
    //if she has special rights, can edit.
    if(editable === true) {
      canEdit = Promise.resolve('admin');
    }
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
                [null],
                SLICE(d.posts, @index+1)
            )
        } IN discussions
        RETURN NEW`;
        var params = {id: id, index: post.index };
        return db.query(query, params);
      });
  };

  discussion.addTag = function (id, tagname, username) {
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR t IN tags FILTER t.name == @tagname
        FOR u IN users FILTER u.username == @username
          INSERT {_from: d._id, _to: t._id, unique: CONCAT (d._id, '-', t._id), creator: u._id, created: @created} INTO discussionTag
          RETURN NEW`;
    var params = {id: id, tagname: tagname, username: username, created: Date.now()};
    
    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error(404);
        if(writes > 1) throw new Error('more than one tag added. This should never happen.');
      })
      .then(null, function (err) {
        if(err.code === 409) throw new Error(409);
        throw err;
      });
  };

  discussion.removeTag = function (id, tagname) {
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR t IN tags FILTER t.name == @tagname
        FOR dt IN discussionTag FILTER dt._from == d._id && dt._to == t._id
          REMOVE dt IN discussionTag`;
    var params = {id: id, tagname: tagname};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error(404);
        if(writes > 1) throw new Error('more than one tag removed. This should never happen.');
      });
  };

  discussion.tags = function (id) {
    var query = `
      FOR d IN discussions FILTER d._key == @id
        FOR dt IN discussionTag FILTER dt._from == d._id
          FOR t IN tags FILTER t._id == dt._to
            RETURN t`
    var params = {id: id};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (tags) {
        return tags;
      });
  };

  discussion.follow = function (id, username, hide) {
    hide = hide === true ? true : false;
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
        UPSERT {_from: u._id, _to: d._id, hide: !@hide}
        INSERT {_from: u._id, _to: d._id, hide: @hide, unique: CONCAT(u._id, '-', d._id), created: @created, visited: 0}
        UPDATE {hide: @hide, created: @created}
        IN userFollowDiscussion
        RETURN IS_NULL(OLD) ? 201 : 200`;
    var params = {id: id, username: username, created: Date.now(), hide: hide};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (codes) {
        if(codes.length === 0) throw new Error(404);
        if(codes.length > 1) throw new Error('found more than one unique discussion id or username. this should never happen');
        return codes[0];
      })
      .then(null, function (err) {
        if(err.code === 409) throw new Error(409);
        throw err;
      });
  };

  discussion.hide = function(id, username) {
    return this.follow(id, username, true);
  }

  discussion.unfollow = function (id, username, hide) {
    hide = hide === true ? true : false;
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
        FOR ufd IN userFollowDiscussion FILTER ufd._from == u._id && ufd._to == d._id && ufd.hide == @hide
        REMOVE ufd IN userFollowDiscussion`;
    var params = {id: id, username: username, hide: hide};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes == 0) throw new Error(404);
        if(writes > 1) throw new Error('more than 1 unfollowed. this should never happen');
      });
  };

  discussion.unhide = function(id, username) {
    return this.unfollow(id, username, true);
  }

  discussion.following = function (username) {
    var query = `FOR u IN users FILTER u.username == @username
      FOR ufd IN userFollowDiscussion FILTER ufd._from == u._id && ufd.hide == false
        FOR d IN discussions FILTER ufd._to == d._id
          RETURN d`;
    var params = {username: username};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  };

  discussion.followingUser = function (id, username) {
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
        FOR ufd IN userFollowDiscussion FILTER u._id == ufd._from && d._id == ufd._to && ufd.hide == false
          RETURN ufd`;
    var params = {id: id, username: username};
    
    return db.query(query, params)
      .then(function (cursor) {return cursor.all();})
      .then(function (resp) {
        if(resp.length > 1) throw new Error('multiple follows. should never happen');
        if(resp.length === 1) return true;
        if(resp.length === 0) return false;
      });
  }

  discussion.followers = function (id) {
    var query = `FOR d IN discussions FILTER d._key == @id
      FOR ufd IN userFollowDiscussion FILTER ufd._to == d._id && ufd.hide == false
        FOR u IN users FILTER u._id == ufd._from
          RETURN u`;
    var params = {id: id};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  };

  discussion.readDiscussionsByTags = function (tags, username) {
    var query = `LET output = (FOR t IN tags FILTER t.name IN @tags
          FOR dt IN discussionTag FILTER dt._to == t._id
              FOR d IN discussions FILTER d._id == dt._from
                  RETURN {discussion: d, tag: t})
      FOR pt IN output
          COLLECT ditt = pt.discussion INTO tags = {name: pt.tag.name, description: pt.tag.description}
          LET tagno = LENGTH(tags)
          SORT tagno DESC
          LET discussion = {topic: ditt.topic, id: ditt._key, posts: LENGTH(ditt.posts)}
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
            LET discussion = {topic: ditt.topic, id: ditt._key, _id: ditt._id, posts: LENGTH(ditt.posts)}
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


  return discussion;
};
