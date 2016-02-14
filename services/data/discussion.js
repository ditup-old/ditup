'use strict';


module.exports = function (db) {
  var discussion = {};
  
  discussion.create = function (dscn) {
    
    var isDataComplete = !!dscn.topic && !!dscn.creator;

    if(!isDataComplete) {
      return Promise.reject('incomplete data');
    }
    else {
      var query = 'INSERT {topic: @topic, creator: @creator, created: @created, posts: []} IN discussions RETURN NEW._key';
      var params = {topic: dscn.topic, creator: dscn.creator, created: dscn.created || Date.now()};

      return db.query(query, params)
        .then(function (cursor) {
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

  return discussion;
};
