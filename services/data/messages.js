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
    var query = `LET usrs=(FOR usr0 IN users FILTER usr0.username == @usr0
      FOR usr1 IN users FILTER usr1.username == @usr1 RETURN {usr0: usr0, usr1: usr1})
      
      LET msgs=(FOR us IN usrs
        FOR msg IN messages FILTER (msg._from == us.usr0._id && msg._to == us.usr1._id) || (msg._from == us.usr1._id && msg._to == us.usr0._id)
          SORT msg.created ASC
          RETURN MERGE(
              msg,
              {from: (msg._from == us.usr0._id ? {username: us.usr0.username} : {username: us.usr1.username})},
              {to: (msg._to == us.usr0._id ? {username: us.usr0.username} : {username: us.usr1.username})}
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
        FOR lm IN lastMsg
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


  messages.update = function () {
    throw new Error('TODO!');
  }; //TODO

  messages.delete = proto.delete('messagess', db);

  messages.addTag = proto.addTag('messagess', db);
  messages.removeTag = proto.removeTag('messagess', db);
  messages.tags = proto.tags('messagess', db);

  //comment
  messages.addComment = proto.addComment('messagess', db);

  messages.readComment = function () {
    throw new Error('TODO!');
  };

  messages.readComments = proto.readComments('messagess', db);
  messages.updateComment;
  messages.removeComment = proto.removeComment('messagess', db);

  messages.follow = proto.follow('messagess', db);
  messages.hide = proto.hide('messagess', db);
  messages.following = proto.following('messagess', db);
  messages.followingUser = proto.followingUser('messagess', db);
  messages.followers = proto.followers('messagess', db);
  messages.countFollowers = proto.countFollowers('messagess', db);
  messages.unfollow = proto.unfollow('messagess', db);
  messages.unhide = proto.unhide('messagess', db);
  messages.readProjectsByTags = proto.readCollectionsByTags(['name', 'description'], 'messagess', db);

  //******************** BEGIN membership functions
  messages.addMember = function (id, username, status, specificParams) {
    let allowedStates = ['joining', 'invited', 'member'];
    if(allowedStates.indexOf(status)<0) return Promise.reject('400');
    specificParams = specificParams || {};

    let request = null;
    if(status === 'joining' && specificParams.hasOwnProperty('request')) {
      request = specificParams.request;
    }

    let query = `FOR p IN messagess FILTER p._key == @id
      FOR u IN users FILTER u.username == @username
        INSERT {
          _from: p._id,
          _to: u._id,
          unique: CONCAT(p._id, '-', u._id),
          status: @status,
          created: @created,
          request: @request
        } IN messagesMember`;
    let params = {
      id: id,
      username: username,
      status: status,
      created: Date.now(),
      request: request
    };

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error('404');
        if(writes > 1) throw new Error('more than one Involvement added. This should never happen.');
      })
      .then(null, function (err) {
        if(err.code === 409) throw new Error('409');
        throw err;
      });
  };

  messages.updateInvolvement = function(id, username, involvement, targetInvolvement, specificParams) {
    return co(function *(){
      let query, params;
      if(involvement === targetInvolvement){
        query = `
            FOR p IN messagess FILTER p._key == @id
              FOR u IN users FILTER u.username == @username
                FOR pm IN messagesMember FILTER pm._from == p._id && pm._to == u._id && pm.status == @involvement
                  UPDATE pm WITH {
                    request: @request,
                    updated: @now
                  } IN messagesMember
            RETURN NEW
          `;
        params = {id: id, username: username, involvement: involvement, request: specificParams.request, now: Date.now()};
      }

      else{
        query = `
            FOR p IN messagess FILTER p._key == @id
              FOR u IN users FILTER u.username == @username
                FOR pm IN messagesMember FILTER pm._from == p._id && pm._to == u._id && pm.status == @involvement
                  UPDATE pm WITH {
                    status: @targetInvolvement,
                    updated: @now
                  } IN messagesMember
            RETURN NEW
          `;
        params = {id: id, username: username, involvement: involvement, targetInvolvement: targetInvolvement, now: Date.now()};
      }

      let out = yield db.query(query, params);
      return Promise.resolve(out);
    })
    .catch(function (err) {
      return Promise.reject(err);
    });
  };
  
  messages.removeInvolvement = function(id, username, involvement) {
    return co(function *(){
      let query = `
          FOR p IN messagess FILTER p._key == @id
            FOR u IN users FILTER u.username == @username
              FOR pm IN messagesMember FILTER pm._from == p._id && pm._to == u._id && pm.status == @involvement
                REMOVE pm IN messagesMember
        `;
      let params = {id: id, username: username, involvement: involvement};

      let out = yield db.query(query, params);
      return Promise.resolve(out);
    })
    .catch(function (err) {
      return Promise.reject(err);
    });
  };

  messages.countMembers = function (id, status) {
    let allowedStates = ['joining', 'invited', 'member'];
    if(allowedStates.indexOf(status)<0) return Promise.reject('400');

    //console.log(id, status);

    let query = `LET pr = (FOR p IN messagess FILTER p._key == @id RETURN p)
      LET pm = (FOR p IN pr
        FOR pm IN messagesMember FILTER pm._from == p._id && pm.status == @status
          RETURN pm)
      LET cpr = COUNT(pr)
      RETURN cpr == 0 ? '404' : (cpr > 1 ? 'duplicate' : COUNT(pm))`;


    let params = {id: id, status: status};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (_memno) {
        let mno = _memno[0];
        if(mno === '404') throw new Error('404');
        if(mno === 'duplicate') throw new Error('duplicate messages id. this should never happen.');
        return mno;
      });
  };
  
  /** which messagess is user member of? **/
  messages.userProjects = function (username, status) {
    status = status || 'all';
    let allowedStates = ['joining', 'invited', 'member'];
    allowedStates.push('all');
    if(allowedStates.indexOf(status)<0) return Promise.reject('400');

    let query, params;
    query = `LET usr = (FOR u IN users FILTER u.username == @username RETURN u) //find the user
      LET pr = (FOR u IN usr
        FOR pm IN messagesMember FILTER pm._to == u._id && (`+ (status === 'all' ? 'true || ' : '') +`pm.status == @status)
          FOR pr IN messagess FILTER pm._from == pr._id 
            RETURN {id: pr._key, status: pm.status, name: pr.name, description: pr.description})
      LET cusr = COUNT(usr)
      RETURN cusr == 0 ? '404' : (cusr > 1 ? 'duplicate' : pr)`;
    params = {username: username, status: status};

    return db.query(query, params) 
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (_proj) {
        let mno = _proj[0];
        if(mno === '404') throw new Error('404');
        if(mno === 'duplicate') throw new Error('duplicate user. this should never happen.');
        return mno;
      });
  }
  

  //extended information about user involvement in messages (like request message etc...)
  /**
   * 
   *
   * @return {status: status[, request: request]}
   */
  messages.userInvolved = function (id, username) {
    let query = `FOR u IN users FILTER u.username == @username
      FOR p IN messagess FILTER p._key == @id
        FOR pm IN messagesMember FILTER pm._from == p._id && pm._to == u._id
          RETURN pm`;


    let params = {id: id, username: username};
    return co(function *() {
      let cursor = yield db.query(query, params);
      let output = yield cursor.all();

      if(output.length >1) return Promise.reject(new Error('duplicate membership. this should never happen.'));

      if(output.length === 1) {
        let allowedStates = ['joining', 'invited', 'member'];

        if(allowedStates.indexOf(output[0].status)>-1) {
          let returnObject = {status: output[0].status};
          if(output[0].status === 'joining') {
            returnObject.request = output[0].request || '';
          }
          return Promise.resolve(returnObject);
        };
      }
      return Promise.resolve({status: ''});
    })
    .catch(function (err) {
      return Promise.reject(err);
    });
  }; 

  messages.userStatus = function (id, username) {
    let query = `FOR u IN users FILTER u.username == @username
      FOR p IN messagess FILTER p._key == @id
        FOR pm IN messagesMember FILTER pm._from == p._id && pm._to == u._id
          RETURN pm.status`;


    let params = {id: id, username: username};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (_status) {
        if(_status.length > 1) throw new Error('duplicate membership. this should never happen.');
        if(_status.length === 1) {
          let allowedStates = ['joining', 'invited', 'member'];
          if(allowedStates.indexOf(_status[0])>-1) return _status[0];
        }
        return '';
      });
  };

  /**
   * @param {Object} user
   * @param {string} user.username
   * @returns {Promise<Array<Object>>} promise of Array of objects: [{dit: Object, tags: [Object]}]
   *
   *
   *
   */
  messages.messagessByTagsOfUser = proto.collectionsByTagsOfUser('messagess', db);
  //********************END
  messages.popular = proto.popular('messagess', db);
  messages.newest = proto.newest('messagess', db);
  messages.random = proto.random('messagess', db);

  return messages;
};
