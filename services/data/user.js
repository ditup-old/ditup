'use strict';


module.exports = function (db) {
  var user = {};

  user.count = function(options) {
    var query=`LET usr = (FOR u IN users FILTER true RETURN u)
    RETURN LENGTH(usr)`;
    var params = {};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (result) {
        return {count: result[0]};
      });
  
  };

  return user;
};
