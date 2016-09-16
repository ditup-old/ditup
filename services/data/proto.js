'use strict';

//factory for database functions

let co = require('co');

var proto = {};
module.exports = proto;

/**
 * @expectedParams: array[string] //what is the correct syntax for this??? TODO
 *
 *
 */

proto.create = function (expectedParams, collectionName, db, otherParams) {
  otherParams = otherParams || '';

  return function (data) {
    var isDataComplete = !!data.creator;
    for (let param of expectedParams) {
      isDataComplete = isDataComplete && data.hasOwnProperty(param);
    }

    if(!isDataComplete) {
      return Promise.reject(new Error('incomplete data'));
    }
    else {
      //building the query string
      var queryExpectedParams = '';
      for (let param of expectedParams) {
        queryExpectedParams += param + ': @' + param + ', '
      }
      var query = 'FOR u IN users FILTER u.username == @creator INSERT {' + queryExpectedParams + otherParams + 'creator: u._id, created: @created} IN ' + collectionName + ' RETURN NEW._key';
      var params = {/*name: data.name, description: data.description, */creator: data.creator, created: data.created || Date.now()};
      for(let param of expectedParams) {
        params[param] = data[param];
      }

      return db.query(query, params)
        .then(function (cursor) {
          var writes = cursor.extra.stats.writesExecuted;
          if (writes === 0) throw new Error(404);
          if (writes > 1) throw new Error('more than 1 '+collectionName+' created. this should never happen');

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
};

proto.read = function (collectionName, db) {
  return function (id) {
    var query = `
      FOR d IN ${collectionName} FILTER d._key == @id
        LET creator = (
          FOR u IN users FILTER u._id == d.creator
              RETURN u
        )
        RETURN MERGE(d, {creator: LENGTH(creator) == 1 ? {username: creator[0].username} : null}, {id: d._key})
    `;
    var params = {id: id};

    return co(function * () {
      let cursor = yield db.query(query, params);
      let collections = yield cursor.all();

      if(collections.length === 1) {
        return collections[0];
      }
      else if(collections.length === 0) {
        let err = new Error('Not Found');
        err.status = 404;
        throw err;
      }
      else {
        throw new Error(`duplicate ${collectionName} id. this should never happen.`);
      }
    });
  };
};

proto.updateField = function (collectionName, db) {
  return function (id, data, field) {
    return db.query(`FOR c IN ${collectionName} FILTER c._key == @id UPDATE c WITH {${field}: @data} IN ${collectionName}`, {id: id, data: data});
  } //TODO
};

proto.delete = function (collectionName, db) {
  return function (id) {
    var query = 'FOR d IN '+collectionName+' FILTER d._key == @id REMOVE d IN '+collectionName;
    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) throw new Error(404);
        else if (writes === 1) return {success: true}
        else throw new Error('problems with removing '+collectionName+' (this should never happen)');
      });
  };
};
  
proto.addComment = function (collectionName, db) {
  return function (id, comment, username) {
    //comment = {text: ''}, username = username, id = collection id (string)
    //username is username of author
    //
    var query = `FOR c IN ` + collectionName + ` FILTER c._key == @id
      FOR u IN users FILTER u.username == @username
        INSERT {_from: c._id, _to: u._id, text: @text, created: @created} INTO ` + singularLowercase(collectionName) + `CommentAuthor
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
};

proto.readComments = function (collectionName, db) {
  return function (id, params) {
    var query = `
      LET col = (FOR c IN ` + collectionName + ` FILTER c._key == @id RETURN c)
      LET out = (FOR c IN col
        FOR cca IN ` + collectionName.slice(0, -1) + `CommentAuthor FILTER cca._from == c._id
          FOR u IN users FILTER u._id == cca._to
            SORT cca.created DESC
            RETURN MERGE(cca, {author: u}, {id: cca._key}))
      RETURN LENGTH(col) == 0 ? 404 : out
    `;
    var queryParams = {id: id};

    return db.query(query, queryParams)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (out) {
        if(out[0] == '404') throw new Error('404');
        return out[0];
      });
  };
};

proto.updateComment = function (collectionName, db) {
  return function (commentId, comment, author) {

    if(!author || !comment.text || !commentId ) return Promise.reject('400');

    var query = `
      LET ddca = (FOR dca IN ` + singularLowercase(collectionName) + `CommentAuthor FILTER dca._key == @commentId RETURN dca)
      LET uuuu = (FOR u IN users FILTER u.username == @author RETURN u)
      LET udca = (FOR dca IN ddca
        FOR u IN uuuu FILTER u._id == dca._to
          UPDATE dca WITH {
            text: @text,
            updated: @updated
          } IN ` + singularLowercase(collectionName) + `CommentAuthor RETURN NEW)
      RETURN LENGTH(ddca)==0 ? '404' : (LENGTH(uuuu)==0 ? '404-user' : (LENGTH(udca)==0 ? '401' : '200'))`;

    var params = {commentId: commentId, text: comment.text, author: author, updated: Date.now()};

    var writes;

    return db.query(query, params)
      .then(function (cursor) {
        writes = cursor.extra.stats.writesExecuted;
        if(writes > 1) throw new Error('more than one comment edited. This should never happen.');
        return cursor.all();
      })
      .then(function (out) {
        if(out[0] === '404') throw new Error('404');
        if(out[0] === '404-user') throw new Error('404-user');
        if(out[0] === '401') throw new Error('401');
        if(out[0] === '200' && writes === 1) return;
        throw new Error('uncaught');
      });
  };
  return function (id, comment, username) {
    //comment = {text: 'new text'}, username = username, id = collection id (string)
    //username is username of author
    //
    var query = `FOR c IN ` + collectionName + ` FILTER c._key == @id
      FOR u IN users FILTER u.username == @username
        INSERT {_from: c._id, _to: u._id, text: @text, created: @created} INTO ` + singularLowercase(collectionName) + `CommentAuthor
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
};

proto.removeComment = function (collectionName, db) { 
  return function (commentId, constraints) {
    //options
    //0 - default - throws error bad data
    //1 - constraints have property id and author - make sure the comment is of that author and collection id
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

    let commentCollection = collectionName.slice(0, -1) + 'CommentAuthor';
    
    if(option === 1) {
      let query = `
        FOR u IN users FILTER u.username == @author
          FOR c IN ` + collectionName + ` FILTER c._key == @id
            FOR cca IN ` + commentCollection + ` FILTER cca._key == @commentId && cca._from == c._id && cca._to == u._id
              REMOVE cca IN ` + commentCollection;
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
        FOR cca IN ` + commentCollection + ` FILTER cca._key == @commentId
          REMOVE cca IN ` + commentCollection;
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
};

proto.addTag = function (collectionName, db) {
  return function (id, tagname, username) {
    var query = `FOR d IN `+ collectionName +` FILTER d._key == @id
      FOR t IN tags FILTER t.name == @tagname
        FOR u IN users FILTER u.username == @username
          INSERT {_from: d._id, _to: t._id, unique: CONCAT (d._id, '-', t._id), creator: u._id, created: @created} INTO `+collectionName.slice(0, -1)+`Tag
          RETURN NEW`;
    var params = {id: id, tagname: tagname, username: username, created: Date.now()};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error(404);
        if(writes > 1) throw new Error('more than one tag added. This should never happen.');
      })
      .then(null, function (err) {
        throw err;
      });
  };
};

proto.removeTag = function (collectionName, db) {
  return function (id, tagname) {
    var query = `FOR d IN `+collectionName+` FILTER d._key == @id
      FOR t IN tags FILTER t.name == @tagname
        FOR dt IN `+collectionName.slice(0, -1)+`Tag FILTER dt._from == d._id && dt._to == t._id
          REMOVE dt IN `+collectionName.slice(0, -1)+`Tag`;
    var params = {id: id, tagname: tagname};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error(404);
        if(writes > 1) throw new Error('more than one tag removed. This should never happen.');
      });
  };
};

/**
 * factory function, return tags of the collection
 *
 *
 *
 */
proto.tags = function (collectionName, db) {
  return function (id) {
    var query = `
      LET col = (FOR d IN `+collectionName+` FILTER d._key == @id RETURN d)
      LET output = (FOR d IN col
        FOR dt IN `+singularLowercase(collectionName)+`Tag FILTER dt._from == d._id
          FOR t IN tags FILTER t._id == dt._to
            RETURN {name: t.name, description: t.description})
      RETURN LENGTH(col) == 0 ? 404 : output`;
    var params = {id: id};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (tags) {
        if(tags[0] == '404') throw new Error('404');
        return tags[0];
      });
  };
};

/**
 * factory function, make @username follow collection with @id (or hide if @hide === true)
 *
 *
 *
 */
proto.follow = function (collectionName, db) {
  return function (id, username, hide) {
    var hide = (hide === true) ? true : false;
    var query = `FOR d IN `+collectionName+` FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
        UPSERT {_from: u._id, _to: d._id, hide: !@hide}
        INSERT {_from: u._id, _to: d._id, hide: @hide, unique: CONCAT(u._id, '-', d._id), created: @created, visited: 0}
        UPDATE {hide: @hide, created: @created}
        IN userFollow`+singularUppercase(collectionName)+`
        RETURN IS_NULL(OLD) ? "201" : "200"`;
    var params = {id: id, username: username, created: Date.now(), hide: hide};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (codes) {
        if(codes.length === 0) throw new Error('404');
        if(codes.length > 1) throw new Error('found more than one unique '+ collectionName +' id or username. this should never happen');
        return codes[0];
      })
      .then(null, function (err) {
        if(err.code === 409) throw new Error('409');
        throw err;
      });
  };
};

/**
 * factory function, return array of collections @collectionName which user @username follows
 *
 *
 *
 */
proto.following = function (collectionName, db) {
  return function (username) {
    var query = `
      LET us = (FOR u IN users FILTER u.username == @username RETURN u)
      LET output = (
        FOR u IN us
          FOR ufd IN userFollow`+singularUppercase(collectionName)+` FILTER ufd._from == u._id && ufd.hide == false
            FOR d IN `+collectionName+` FILTER ufd._to == d._id
              RETURN MERGE(d, {id: d._key})
      )
      RETURN LENGTH(us) == 0 ? "404" : output`;
    var params = {username: username};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (output) {
        if(output[0] === '404') throw new Error('404');
        return output[0];
      });
  };
};

/**
 * factory function, returns boolean indicating whether user @username follows (or hides if @hide === true) the collection @collectionName with id @id
 *
 *
 *
 */
proto.followingUser = function (collectionName, db) {
  return function (id, username, hiding) {
    var hiding = hiding === true ? true : false;
    var query = `
      LET col = (FOR d IN `+collectionName+` FILTER d._key == @id RETURN d)
      LET us = (FOR u IN users FILTER u.username == @username RETURN u)
      LET output = (
        FOR d IN col
          FOR u IN us
            FOR ufd IN userFollow`+singularUppercase(collectionName)+` FILTER u._id == ufd._from && d._id == ufd._to && ufd.hide == @hiding
              RETURN ufd)
      RETURN LENGTH(col) == 0 ? "404" : (LENGTH(us) == 0 ? "404" : output)`;// a small edit and we can distinguish between missing collection vs. user

    var params = {id: id, username: username, hiding: hiding};
    
    return db.query(query, params)
      .then(function (cursor) {return cursor.all();})
      .then(function (resp) {
        if(resp[0] === '404') throw new Error('404');
        if(resp[0].length > 1) throw new Error('multiple follows. should never happen');
        if(resp[0].length === 1) return true;
        if(resp[0].length === 0) return false;
      });
  };
};

/**
 * factory function, returns list of users who follow the collection @collectionName with id @id
 *
 *
 *
 */
proto.followers = function (collectionName, db) {
  return function (id) {
    var query = `
      LET col = (FOR d IN `+collectionName+` FILTER d._key == @id RETURN d)
      LET output = (
        FOR d IN col
          FOR ufd IN userFollow`+singularUppercase(collectionName)+` FILTER ufd._to == d._id && ufd.hide == false
            FOR u IN users FILTER u._id == ufd._from
              RETURN u
      )
      RETURN LENGTH(col) == 0 ? "404" : output`;
    var params = {id: id};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (out) {
        if(out[0]==='404') throw new Error('404');
        return out[0];
      });
  };
};

proto.countFollowers = function (collectionName, db) {
  return function (id) {
    var query = `
      LET col = (FOR d IN ${collectionName} FILTER d._key == @id RETURN d)
      LET output = (
        FOR d IN col
          FOR ufd IN userFollow${singularUppercase(collectionName)} FILTER ufd._to == d._id && ufd.hide == false
            RETURN null
      )
      RETURN LENGTH(col) == 0 ? "404-error" : COUNT(output)`;
    var params = {id: id};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (out) {
        if(out[0]==='404-error') throw new Error('404');
        return out[0];
      });
  };
};

/**
 * factory function, hides collection @id (set hide=true in userFollow[Collection]) from user @username
 * collection.hide(id, username) equals collection.follow(id, username, true)
 *
 *
 */
proto.hide = function (collectionName, db) {
  var hide = this.follow(collectionName, db);
  return function(id, username) {
    return hide(id, username, true);
  };
};

/**
 * factory function, removes follow (or hide if hide === true)
 *
 *
 *
 */
proto.unfollow = function (collectionName, db) {
  return function (id, username, hide) {
    var hide = hide === true ? true : false;
    var sgUp = singularUppercase(collectionName);
    var query = `FOR d IN `+collectionName+` FILTER d._key == @id
      FOR u IN users FILTER u.username == @username
        FOR ufd IN userFollow`+sgUp+` FILTER ufd._from == u._id && ufd._to == d._id && ufd.hide == @hide
        REMOVE ufd IN userFollow`+sgUp;
    var params = {id: id, username: username, hide: hide};

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes == 0) throw new Error('404');
        if(writes > 1) throw new Error('more than 1 unfollowed. this should never happen');
      });
  };
};

/**
 * factory function, removes hide
 *
 *
 *
 */
proto.unhide = function (collectionName, db) {
  var unhide = this.unfollow(collectionName, db);
  return function(id, username) {
    return unhide(id, username, true);
  };
};

proto.readCollectionsByTags = function (collectionParams, collectionName, db) {
  var pms = '';
  for(let cp of collectionParams) {
    pms += cp + ': ditt.' + cp + ', ';
  }
  var sg = singularLowercase(collectionName);
  return function (tags, username) {
    var query = `LET output = (FOR t IN tags FILTER t.name IN @tags
          FOR dt IN `+sg+`Tag FILTER dt._to == t._id
              FOR d IN `+collectionName+` FILTER d._id == dt._from
                  RETURN {` + sg + `: d, tag: t})
      FOR pt IN output
          COLLECT ditt = pt.` + sg + ` INTO tags = {name: pt.tag.name, description: pt.tag.description}
          LET tagno = LENGTH(tags)
          SORT tagno DESC
          LET ` + sg + ` = {` + pms + `id: ditt._key}
          RETURN {` + sg + `: ` + sg + `, tags: tags, tagno: tagno}`;
    var params = {tags: tags};

    if(username) {
      query = `LET output = (FOR t IN tags FILTER t.name IN @tags
            FOR dt IN `+sg+`Tag FILTER dt._to == t._id
                FOR d IN `+collectionName+` FILTER d._id == dt._from
                    RETURN {` + sg + `: d, tag: t})
        LET collected = (FOR pt IN output
            COLLECT ditt = pt.` + sg + ` INTO tags = {name: pt.tag.name, description: pt.tag.description}
            LET tagno = LENGTH(tags)
            LET ` + sg + ` = {`+ pms +`id: ditt._key, _id: ditt._id, posts: LENGTH(ditt.posts)}
            RETURN {` + sg + `: ` + sg + `, tags: tags, tagno: tagno})
        LET hidden = (FOR u IN users FILTER u.username == @username
          FOR c IN collected
            FOR ufd IN userFollow`+singularUppercase(collectionName)+` FILTER ufd._from == u._id && ufd._to == c.` + sg + `._id && ufd.hide == true
              RETURN c.` + sg + `._id)
        FOR c IN collected FILTER c.` + sg + `._id NOT IN hidden
          SORT c.tagno DESC
          RETURN c`;
      params = {tags: tags, username: username};
    }

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (collections) {
        return collections;
      });
    ; 
  };
};

/**
 * this is not that correct. this describes what return function is
 * in options: number of shown dits, limit, dittype or all
 * @param {Object} [options]
 * @param {Object} [options.limit]
 * @param {number} [options.limit.offset=0]
 * @param {number} [options.limit.count=5]
 * @returns {Promise} {name, description, userno, ditno, no}[]
 */
proto.popular = function (collectionName, db) {
  return function (type, options) {
    let allowedTypes = ['followers'];
    if(allowedTypes.indexOf(type) === -1) throw new Error('bad popular parameter');

    var options = options || {};
    options.limit = options.limit || {};
    options.limit.offset = options.limit.offset || 0;
    options.limit.count = options.limit.count || 5;

    let sg = singularLowercase(collectionName);
    let sgUp = singularUppercase(collectionName);

    var query=`FOR i IN ` + collectionName + `
      LET followerno = LENGTH(FOR ufi IN userFollow` + sgUp + ` FILTER ufi._to == i._id RETURN i._key)
      SORT followerno DESC
      LIMIT @offset, @count
      RETURN MERGE(i, {id: i._key, followerno: followerno})`;

    var params = {
      offset: options.limit.offset,
      count: options.limit.count
    };

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //you can do something with results here
        return results;
      });
  };
};

proto.newest = function (collectionName, db) {
  return function (options) {

    var options = options || {};
    options.limit = options.limit || {};
    options.limit.offset = options.limit.offset || 0;
    options.limit.count = options.limit.count || 5;

    let sg = singularLowercase(collectionName);
    let sgUp = singularUppercase(collectionName);

    var query=`FOR i IN ` + collectionName + `
      SORT i.created DESC
      LIMIT @offset, @count
      RETURN MERGE(i, {id: i._key})`;

    var params = {
      offset: options.limit.offset,
      count: options.limit.count
    };

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //you can do something with results here
        return results;
      });
  };
};

proto.random = function (collectionName, db) {
  return function (options) {

    var options = options || {};
    options.limit = options.limit || {};
    options.limit.count = options.limit.count || 1;

    let sg = singularLowercase(collectionName);
    let sgUp = singularUppercase(collectionName);

    var query=`FOR i IN ` + collectionName + `
      SORT RAND()
      LIMIT @count
      RETURN MERGE(i, {id: i._key})`;

    var params = {
      count: options.limit.count
    };

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //you can do something with results here
        return results;
      });
  };
};

proto.collectionsByTagsOfUser = function (collectionName, db) {
  let sg = singularLowercase(collectionName);
  let sgUp = singularUppercase(collectionName);

  return function (username, showHidden) {
    let showHiddenIsGood = showHidden === true || showHidden === false || showHidden === undefined;
    if(!showHiddenIsGood) return Promise.reject('400');
    showHidden = showHidden === true ? true : false;
    

    var query = `LET usrs = (FOR u IN users FILTER u.username == @username
        RETURN u)
      LET tagsOfUser = (FOR u IN usrs
        FOR ut IN userTag FILTER ut._from == u._id
            FOR t IN tags FILTER t._id == ut._to
              RETURN t)
      LET output = (FOR t IN tagsOfUser
        FOR pt IN ` + sg + `Tag FILTER pt._to == t._id
          FOR p IN ` + collectionName + ` FILTER p._id == pt._from
            RETURN {` + sg + `: p, tag: t})
      LET cols = (FOR pt IN output
        COLLECT col = pt.` + sg + ` INTO tags = {name: pt.tag.name, description: pt.tag.description}
        LET tagno = LENGTH(tags)
        SORT tagno DESC
        //LET ` + sg + ` = {id: col._key, name: col.name, _id: col._id}
        RETURN {` + sg + `: col, tags: tags, tagno: tagno})
      
      //now finding out whether the collection is hidden
      LET hip = (FOR p IN cols
        FOR u IN usrs
          LET hidden = (COUNT(FOR ufp IN userFollow` + sgUp + ` FILTER u._id == ufp._from && p.` + sg + `._id == ufp._to && ufp.hide == true RETURN ufp))
          RETURN {id: p.` + sg + `._key, name: p.` + sg + `.name, description: p.` + sg + `.description, tags: p.tags, hidden: hidden})
          
      LET ret = (FOR h IN hip ` + (showHidden === true ? '' : 'FILTER h.hidden == 0') + ` RETURN h)
      RETURN COUNT(usrs)==0 ? '404' : (COUNT(usrs)>1 ? 'duplicate': ret)`;
    var params = {username: username};
    
    return co(function *() {
      let cursor = yield db.query(query, params);
      let out = (yield cursor.all())[0];

      if(out === '404') throw new Error('404');
      if(out === 'duplicate') throw new Error('duplicate');
      return Promise.resolve(out);
    })
    .catch(function (err) {
      return Promise.reject(err);
    });
  };
};

function singularUppercase(collectionName) {
  return collectionName.slice(0,1).toUpperCase()+collectionName.slice(1, -1);
}

function singularLowercase(collectionName) {
  return collectionName.slice(0,-1);
}
