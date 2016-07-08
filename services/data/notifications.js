'use strict';

var proto = require('./proto');
var co = require('co');

module.exports = function (db) {
  var notifications = {};

  notifications.create = function (notification) {
    var query = `FOR to IN users FILTER to.username == @to
        INSERT {
          to: to._id,
          text: @text,
          url: @url,
          created: @created,
          viewed: false
        } IN notifications
        RETURN NEW`;

    var params = {to: notification.to, text: notification.text, url: notification.url, created: Date.now()};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let saved = cursor.extra.stats.writesExecuted;
      if(saved === 0) throw new Error('404');
      if(saved > 1) throw new Error('duplicate user - this should never happen');
      let out = yield cursor.all();
      return {id: out[0]._key};
    });
  };

  notifications.read = function (username, options) {
    options = options || {};
    if(!username && typeof(username) !== 'string') {
      let err = new Error('bad data');
      err.status = 400;
      throw err;
    };
    var query = `
      LET user=(
        FOR usr IN users FILTER usr.username == @username
            RETURN usr
      )
      LET nots=(
        FOR us IN user
          FOR nt IN notifications FILTER us._id == nt.to
            SORT nt.created ASC
            RETURN MERGE(
              nt,
              {to: {username: us.username}},
              {id: nt._key}
            )
      )
      RETURN LENGTH(user) == 0 ? '404' : nots`;
    var params = {username: username};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      if(out[0] === '404') {
        let err = new Error('user not found');
        err.status = 404;
        throw err;
      }
      return out[0];
    });
  };

  /**
   * this makes all the notifications from someone to someone viewed: true;
   *
   *
   */
  notifications.view = function (id, username) {
    let query = `
      FOR u IN users FILTER u.username == @username
        FOR nt IN notifications FILTER nt._key == @id && nt.to == u._id
          UPDATE nt WITH {viewed: true} IN notifications
          RETURN {id: OLD._key, url: OLD.url, text: OLD.text}`;
    let params = {username: username, id: id};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      console.log(out[0]);
      return out[0];
    });
  }

  notifications.remove = function (id, username) {
    let query = `
      FOR u IN users FILTER u.username == @username
        FOR nt IN notifications FILTER nt._key == @id && nt.to == u._id
          REMOVE nt IN notifications
          RETURN OLD`;
    let params = {username: username, id: id};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let removed = cursor.extra.stats.writesExecuted;
      if(removed === 0) {
        throw new Error('Error, notification not deleted');
      }
      if(removed > 1) {
        throw new Error('multiple notifications deleted. this should never happen.');
      }
      return;
    });
  }

  notifications.countUnviewed = function (username) {
    let query = `
      FOR u IN users FILTER u.username == @username
        LET n = (
          FOR n IN notifications FILTER n.to == u._id && !n.viewed
            RETURN n
        )
        RETURN COUNT(n)`;
    var params = {username: username};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      if(out.length === 0) throw new Error('404 - User not found');
      if(out.length > 1) throw new Error('duplicate user');
      return out[0];
    });
  };

  return notifications;
};
