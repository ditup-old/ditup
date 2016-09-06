'use strict';

var proto = require('./proto');
var co = require('co');

module.exports = function (db) {
  var messages = {};

  messages.create = function (message) {
    var query = `FOR fr IN users FILTER fr.username == @from
      FOR to IN users FILTER to.username == @to
        INSERT {
          _from: fr._id,
          _to: to._id,
          text: @text,
          created: @created,
          viewed: false,archived: false
        } IN messages`;

    var params = {from: message.from, to: message.to, text: message.text, created: Date.now()};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let saved = cursor.extra.stats.writesExecuted;
      if(saved === 0) throw new Error('404');
      if(saved > 1) throw new Error('duplicate user - this should never happen');
      return Promise.resolve();
    });
  };

  messages.read = function (users) {
    if(users.length !== 2 || users[0] === users[1]) {
      let err = new Error('bad data');
      err.status = 400;
      throw err;
    };
    var query = `
      LET usrs=(
        FOR usr0 IN users FILTER usr0.username == @usr0
          FOR usr1 IN users FILTER usr1.username == @usr1
            RETURN [
              usr0,
              usr1
            ]
      )
      LET msgs=(
        FOR us IN usrs
          FOR msg IN messages FILTER (msg._from == us[0]._id && msg._to == us[1]._id) || (msg._from == us[1]._id && msg._to == us[0]._id)
          SORT msg.created ASC
          RETURN MERGE(
              msg,
              {from: (msg._from == us[0]._id ? {username: us[0].username} : {username: us[1].username})},
              {to: (msg._to == us[0]._id ? {username: us[0].username} : {username: us[1].username})}
          ))
      RETURN LENGTH(usrs) == 0 ? '404' : msgs`;
    var params = {usr0: users[0], usr1: users[1]};

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

  messages.readLast = function (username, settings) {
    /*
    let query = `
      LET msgs = (FOR usr IN users FILTER usr.username == @username
        FOR msg IN messages FILTER msg._from == usr._id || msg._to == usr._id
          LET otherUserId = msg._from == usr._id ? msg._to : msg._from
          FOR ousr IN users FILTER ousr._id == otherUserId
            RETURN MERGE(msg, {user: {username: usr.username, _id: usr._id}}, {otherUser: {username: ousr.username, _id: ousr._id}})
      )
      LET msgsByUser = (
        FOR msg IN msgs
          SORT msg.created DESC
          COLLECT ou = msg.otherUser, u = msg.user INTO messagesOfUser
          RETURN {user: u, otherUser: ou, msgs: messagesOfUser[*].msg}
      )

      FOR mbu IN msgsByUser
        LET lastMsg = (FOR m IN mbu.msgs
          LIMIT 1
          RETURN m
        )
        LET lm = lastMsg[0]
        SORT lm.created DESC
        RETURN {
          text: lm.text,
          created: lm.created,
          viewed: mbu.otherUser._id == lm._from ? lm.viewed : null,
          from: mbu.otherUser._id == lm._from ? {username: mbu.otherUser.username} : {username: mbu.user.username},
          to: mbu.otherUser._id == lm._to ? {username: mbu.otherUser.username} : {username: mbu.user.username}
        }`;
    // */
    let query = `
      LET msgs = (FOR usr IN users FILTER usr.username == @username
        FOR msg IN messages FILTER msg._from == usr._id || msg._to == usr._id
          //LET otherUserId = msg._from == usr._id ? msg._to : msg._from
          LET fromUserId = msg._from
          LET toUserId = msg._to
          FOR fromUser IN users FILTER fromUser._id == fromUserId
            FOR toUser IN users FILTER toUser._id == toUserId
              LET oneUser = fromUser.username == @username ? {username: fromUser.username, _id: fromUser._id} : {username: toUser.username, _id: toUser._id}
              LET otherUser = fromUser.username == @username ? {username: toUser.username, _id: toUser._id} : {username: fromUser.username, _id: fromUser._id}
              RETURN MERGE(msg, {user: oneUser}, {otherUser: otherUser})
      )
      LET msgsByUser = (
        FOR msg IN msgs
          SORT msg.created DESC
          COLLECT ou = msg.otherUser, u = msg.user INTO messagesOfUser
          RETURN {user: u, otherUser: ou, msgs: messagesOfUser[*].msg}
      )

      FOR mbu IN msgsByUser
        LET lastMsg = (FOR m IN mbu.msgs
          LIMIT 1
          RETURN m
        )
        LET lm = lastMsg[0]
        SORT lm.created DESC
        RETURN {
          text: lm.text,
          created: lm.created,
          viewed: mbu.otherUser._id == lm._from ? lm.viewed : null,
          from: mbu.otherUser._id == lm._from ? {username: mbu.otherUser.username} : {username: mbu.user.username},
          to: mbu.otherUser._id == lm._to ? {username: mbu.otherUser.username} : {username: mbu.user.username}
        }`;
    var params = {username: username};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      return out;
    });
  };
  
  /**
   * this makes all the messages from someone to someone viewed: true;
   *
   *
   */
  messages.view = function (which) {
    let from = which.from;
    let to = which.to;

    let query = `FOR fr IN users FILTER fr.username == @from
      FOR to IN users FILTER to.username == @to
        FOR msg IN messages FILTER msg._from == fr._id && msg._to == to._id && msg.viewed == false && msg.created <= @now
          UPDATE msg WITH {viewed: true} IN messages`;
    let params = {from: from, to: to, now: Date.now()};

    return co(function *() {
      yield db.query(query, params);
      return;
    });
  }

  messages.countUnread = function (username) {
    let query = `FOR u IN users FILTER u.username == @username
        LET m = (FOR m IN messages FILTER m._to == u._id && !m.viewed && !m.archived RETURN m)
        RETURN COUNT(m)`;
    var params = {username: username};

    return co(function *() {
      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      if(out.length === 0) throw new Error('404 - User not found');
      if(out.length > 1) throw new Error('duplicate user');
      return out[0];
    });
  };

  return messages;
};
