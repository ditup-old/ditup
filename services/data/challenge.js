'use strict';


module.exports = function (db) {
  var challenge = {};

  challenge.create = function (data) {
    
    var isDataComplete = !!data.name && !!data.creator && !!data.description;

    if(!isDataComplete) {
      return Promise.reject('incomplete data');
    }
    else {
      var query = 'FOR u IN users FILTER u.username == @creator INSERT {name: @name, description: @description, creator: u._id, created: @created} IN challenges RETURN NEW._key';
      var params = {name: data.name, description: data.description, creator: data.creator, created: data.created || Date.now()};

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

  return challenge;
};
