'use strict';

//factory for database functions

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
      isDataComplete = isDataComplete && !!data[param];
    }

    if(!isDataComplete) {
      return Promise.reject('incomplete data');
    }
    else {
      //building the query string
      var queryExpectedParams = '';
      for (let param of expectedParams) {
        queryExpectedParams += param + ': @' + param + ', '
      }
      var query = 'FOR u IN users FILTER u.username == @creator INSERT {' + queryExpectedParams + otherParams + 'creator: u._id, created: @created} IN ' + collectionName + ' RETURN NEW._key';
      //var query = 'FOR u IN users FILTER u.username == @creator INSERT {name: @name, description: @description, creator: u._id, created: @created} IN challenges RETURN NEW._key';
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

proto.read = function () {
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
        if(err.code === 409) throw new Error(409);
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

proto.tags = function (collectionName, db) {
  return function (id) {
    var query = `
      LET col = (FOR d IN `+collectionName+` FILTER d._key == @id RETURN d)
      LET output = (FOR d IN col
        FOR dt IN `+collectionName.slice(0,-1)+`Tag FILTER dt._from == d._id
          FOR t IN tags FILTER t._id == dt._to
            RETURN t)
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

proto.following = function (collectionName, db) {
  return function (username) {
    var query = `
      LET us = (FOR u IN users FILTER u.username == @username RETURN u)
      LET output = (
        FOR u IN us
          FOR ufd IN userFollow`+singularUppercase(collectionName)+` FILTER ufd._from == u._id && ufd.hide == false
            FOR d IN `+collectionName+` FILTER ufd._to == d._id
              RETURN d
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

proto.followingUser = function (collectionName, db) {
  return function (id, username, hiding) {
    var hiding = !!hiding;
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

proto.hide = function (collectionName, db) {
  var hide = this.follow(collectionName, db);
  return function(id, username) {
    return hide(id, username, true);
  };
};

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
  var sg = collectionName.slice(0, -1);
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

function singularUppercase(collectionName) {
  return collectionName.slice(0,1).toUpperCase()+collectionName.slice(1, -1);
};
