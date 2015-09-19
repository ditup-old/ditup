'use strict';

var Database = require('arangojs');

var config = require('./db-config');

var db = new Database({url: config.url, databaseName: config.dbname});

module.exports = {
  //user
  ////C
  createUser: function (user) {
    //var graph = db.graph('ditg');
    //var userCollection = graph.vertexCollection('users');
    //return userCollection.save(user);
    return db.query('INSERT @user IN users', {user: user});
  },

  ////R
  readUser: function (user) {
    return db.query('FOR x IN users FILTER x.username == @username RETURN x', {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (users) {
        if(users.length === 1) return users[0];
        if(users.length === 0) throw new Error('user ' + user.username + ' not found');
        if(users.length > 1) throw new Error('database corruption: username ' + user.username + ' is not unique');
      });
  },
  readUserProfile: function (user) {
    return db.query('FOR x IN users FILTER x.username == @username RETURN {profile: x.profile}', {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  readUserSettings: function (user) {
    return db.query('FOR x IN users FILTER x.username == @username RETURN {settings: x.settings}', {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  usernameExists: function (username) {
    return db.query('FOR x IN users FILTER x.username == @username ' +
      'COLLECT WITH COUNT INTO number ' +
      'RETURN number', {username: username})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (output) {
        var number = output[0];
        if(number === 0) return false;
        else return true;
      });
  },
  emailExists: function (email) {
    return db.query('FOR x IN users FILTER x.email == @email ' +
      'COLLECT WITH COUNT INTO number ' +
      'RETURN number', {email: email})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (output) {
        var number = output[0];
        if(number === 0) return false;
        else return true;
      });
  },
  login: function (user) {},
  ////U
  updateUserProfile: function (user) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {profile: @profile} IN users', {username: user.username, profile: user.profile});
  },
  updateUserSettings: function (user) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {settings: @settings} IN users', {username: user.username, settings: user.settings});
  },
  updateUserAccount: function (user, account) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {account: @account} IN users', {username: user.username, account: account});
  },
  updateUserEmailVerifyCode: function (user, data) {
    var query = 'FOR x IN users FILTER x.username == @username ' +
      'UPDATE x WITH {account: {email: @data}} IN users';
    var email = {
      create_date: data.create_date,
      code: data.code,
      salt: data.salt,
      iterations: data.iterations
    };
    return db.query(query, {username: user.username, data: email});
  },
  updateUserEmailVerified: function (user, data) {
    var query = 'FOR x IN users FILTER x.username == @username ' +
      'UPDATE x WITH {account: {email: @data}} IN users';
    var email = {
      verified: data.verified,
      verify_date: data.verify_date
    };
    return db.query(query, {username: user.username, data: email});
  },
  ////D
  deleteUser: function (user) {
    return db.query('FOR x IN users FILTER x.username == @username REMOVE x IN users', {username: user.username});
  },
  //dit
  createDit: function (dit) {
    return db.query('INSERT @dit IN dits', {dit: dit});
  },
  readDit: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url RETURN x', {url: dit.url})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  readDitProfile: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url RETURN {profile: x.profile}', {url: dit.url})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  readDitSettings: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url RETURN {settings: x.settings}', {url: dit.url})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  updateDitProfile: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url UPDATE x WITH {profile: @profile} IN dits', {url: dit.url, profile: dit.profile});
  },
  updateDitSettings: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url UPDATE x WITH {settings: @settings} IN dits', {url: dit.url, settings: dit.settings});
  },
  deleteDit: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url REMOVE x IN dits', {url: dit.url});
  },
  //tag
  createTag: function (tag) {
    return db.query('INSERT @tag IN tags', {tag: tag});
  },
  readTag: function (tag) {
    return db.query('FOR x IN tags FILTER x.name == @name RETURN x', {name: tag.name})
  },
  updateTag: function (tag) {
    return db.query('FOR x IN tags FILTER x.name == @name UPDATE x WITH @tag IN tags', {name: tag.name, tag: tag});
  },
  deleteTag: function (tag) {
    return db.query('FOR x IN tags FILTER x.name == @name REMOVE x IN tags', {name: tag.name});
  },
  //talk
  ///C
  createTalk: function (talk) {
  },
  
  //tag-user
  addTagToUser: function (tag, user) {
    var query = 'FOR x IN users FILTER x.username == @username ' +
      'FOR y IN tags FILTER y.name == @name ' +
      'INSERT {_from: x._id, _to: y._id } IN userTag';
    return db.query(query, {username: user.username, name: tag.name});
  },
  readTagsOfUser: function (user) {
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'FOR ut IN userTag FILTER ut._from == u._id ' +
      'FOR t IN tags FILTER t._id == ut._to ' +
      'RETURN t';
    return db.query(query, {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  deleteTagFromUser: function (tag, user) {
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'FOR t IN tags FILTER t.name == @name ' +
      'FOR ut IN userTag FILTER u._id == ut._from && t._id == ut._to ' +
      'REMOVE ut IN userTag';
    return db.query(query, {username: user.username, name: tag.name});
  },
  //tag-dit
  addTagToDit: function (tag, dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR t IN tags FILTER t.name == @name ' +
      'INSERT {_from: d._id, _to: t._id } IN ditTag';
    return db.query(query, {url: dit.url, name: tag.name});
  },
  readTagsOfDit: function (dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR dt IN ditTag FILTER dt._from == d._id ' +
      'FOR t IN tags FILTER t._id == dt._to ' +
      'RETURN t';
    return db.query(query, {url: dit.url})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  deleteTagFromDit: function (tag, dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR t IN tags FILTER t.name == @name ' +
      'FOR dt IN ditTag FILTER d._id == dt._from && t._id == dt._to ' +
      'REMOVE dt IN ditTag';
    return db.query(query, {url: dit.url, name: tag.name});
  },
  //user-dit
  addUserToDit: function (user, dit, relation) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'INSERT {_from: u._id, _to: d._id, relation: @rel} IN memberOf';
    return db.query(query, {url: dit.url, username: user.username, rel: relation});
  },
  readUsersOfDit: function (dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR ud IN memberOf FILTER ud._to == d._id ' +
      'FOR u IN users FILTER u._id == ud._from ' +
      'RETURN {user: u, relation: ud.relation}';
    return db.query(query, {url: dit.url})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  readDitsOfUser: function (user) {
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER ud._from == u._id ' +
      'FOR d IN dits FILTER d._id == ud._to ' +
      'RETURN {dit: d, relation: ud.relation}';
    return db.query(query, {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      });
  },
  updateUserDit: function (user, dit, relation) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'UPDATE ud WITH {relation: @rel} IN memberOf';
    return db.query(query, {url: dit.url, username: user.username, rel: relation});
  },
  deleteUserFromDit: function (user, dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'REMOVE ud IN memberOf';
    return db.query(query, {url: dit.url, username: user.username});
  },
  isMember: function (user, dit) {
    var query = 'FOR d IN dits FILTER d.url == "dit2" ' +
      'FOR u IN users FILTER u.username == "test1" ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'RETURN ud.relation == "member" || ud.relation == "admin"';
    return db.query(query, {url: dit.url, username: user.username})
      .then(function (cursor) {
        return cursor.all()
      })
      .then(function (results) {
        var ret = false;
        for (var i = 0, len = results.length; i<len; i++) {
          ret = ret || results[i];
        }
        return ret;
      });
  },
  isAdmin: function (user, dit) {
    var query = 'FOR d IN dits FILTER d.url == "dit2" ' +
      'FOR u IN users FILTER u.username == "test1" ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'RETURN ud.relation == "admin"';
    return db.query(query, {url: dit.url, username: user.username})
      .then(function (cursor) {
        return cursor.all()
      })
      .then(function (results) {
        var ret = false;
        for (var i = 0, len = results.length; i<len; i++) {
          ret = ret || results[i];
        }
        return ret;
      });
  }
};
