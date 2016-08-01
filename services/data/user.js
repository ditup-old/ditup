'use strict';

let co = require('co');

module.exports = function (db) {
  //functions:
  //create
  //read
  //update
  //delete
  //count
  var user = {};

  user.create = function (user) {
    //var graph = db.graph('ditg');
    //var userCollection = graph.vertexCollection('users');
    //return userCollection.save(user);
    return db.query('INSERT @user IN users', {user: user});
  };

  user.read = function (user) {
    var isUsername;
    if(user.hasOwnProperty('username')){
      isUsername = true;
    }
    else if(user.hasOwnProperty('email')){
      isUsername = false;
    }
    else throw new Error('user.username or user.email must be provided');
    
    var query = isUsername
      ? 'FOR u IN users FILTER u.username == @username RETURN u'
      : 'FOR u IN users FILTER u.email == @email RETURN u';
    var params = isUsername
      ? {username: user.username}
      : {email: user.email};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (users) {
        if(users.length === 1) return users[0];
        if(users.length === 0) return null; //throw new Error('user ' + user.username + ' not found');
        if(users.length > 1) throw new Error('database corruption: username ' + user.username + ' is not unique');
      });
  };

  user.search = function (string) {
    var query = 'FOR u IN users ' +
      'FILTER LIKE(u.username, CONCAT("%", @string, "%"), true) ' +
      'RETURN {username: u.username}';
    var params = {string: string};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  };

  user.readProfile = function (user) {
    return db.query('FOR x IN users FILTER x.username == @username RETURN {profile: x.profile}', {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (users) {
        if(users.length === 1) return users[0];
        if(users.length === 0) return null; // throw new Error('user ' + user.username + ' not found');
        if(users.length > 1) throw new Error('database corruption: username ' + user.username + ' is not unique');
      });
  };

  user.readSettings = function (user) {
    return db.query('FOR u IN users FILTER u.username == @username RETURN {settings: u.settings}', {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (users) {
        if(users.length === 1) return users[0];
        if(users.length === 0) return null; //throw new Error('user ' + user.username + ' not found');
        if(users.length > 1) throw new Error('database corruption: username ' + user.username + ' is not unique');
      });
  };

  user.newUsers = function (limit) {
    limit = limit || 5;
    return co(function * () {
      let query = `
        FOR u IN users FILTER u.account.email.verified == true && u.account.active_account == true
          SORT users.created DESC
          LIMIT @limit
          RETURN u
        `;
      let params = {limit: limit};

      let cursor = yield db.query(query, params);
      return yield cursor.all();
    });
  }

  user.usernameExists = function (username) {
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
  };

  user.emailExists = function (email) {
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
  };

  ////U
  user.updateProfile = function (user, profile) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {profile: @profile} IN users', {username: user.username, profile: profile});
  };

  user.updateSettings = function (user, settings) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {settings: @settings} IN users', {username: user.username, settings: settings});
  };

  user.updateAccount = function (user, account) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {account: @account} IN users', {username: user.username, account: account});
  };

  user.updateEmailVerifyCode = function (user, data) {
    
    var query = 'FOR x IN users FILTER x.username == @username ' +
      'UPDATE x WITH {email: @email, account: {email: @data}} IN users';
    var email = {
      create_date: data.create_date,
      hash: data.hash,
      salt: data.salt,
      iterations: data.iterations,
      verified: false
    };
    var params = {
      data: email,
      username: user.username,
      email: user.email
    }

    return db.query(query, params);
  };

  user.updateEmailVerified = function (user, data) {
    var query = 'FOR x IN users FILTER x.username == @username ' +
      'UPDATE x WITH {account: {email: @data}} IN users';
    var email = {
      verified: data.verified,
      verify_date: data.verifyDate,
      hash: null,
      salt: null,
      iterations: null,
      create_date: null
    };
    return db.query(query, {username: user.username, data: email});
  };

  /**
   * @param {Object} user
   * @param {Object} data
   */
  user.updateResetPasswordCode = function (user, data) {
    
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'UPDATE u WITH {account: {reset_password: @data}} IN users';
    var resetData = {
      create_date: data.create_date,
      hash: data.hash,
      salt: data.salt,
      iterations: data.iterations
    };
    var params = {
      data: resetData,
      username: user.username
    };

    return db.query(query, params);
  };

  /**
   * @param {Object} user
   * @param {Object} data
   */
  user.updatePassword = function (user, login) {
    
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'UPDATE u WITH @data IN users';

    var passData = {
      account:{
        reset_password: null
      },
      login: {
        salt: login.salt,
        hash: login.hash,
        iterations: login.iterations
      }
    };
    var params = {
      data: passData,
      username: user.username
    };

    return db.query(query, params);
  };

  ////D
  user.delete = function (user) {
    return db.query('FOR u IN users FILTER u.username == @username REMOVE u IN users', {username: user.username});
  };

  user.count = function (options) {
    var query=`LET usr = (FOR u IN users FILTER u.account.email.verified == true && u.account.active_account == true RETURN u)
    RETURN LENGTH(usr)`;
    var params = {};

    return co(function * () {
      let cursor = yield db.query(query, params);
      let result = yield cursor.all();
      return result[0];
    });
  };

  user.addTag = function (user, tag) {
    var query = 'FOR x IN users FILTER x.username == @username LET from = x._id ' +
      'FOR y IN tags FILTER y.name == @name LET to = y._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to), created: @created } IN userTag';
    return db.query(query, {username: user.username, name: tag.name, created: Date.now()})
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) throw new Error('404');
        if (writes === 1) return {success: true};
        throw new Error('problems with adding tag');
      });
  };

  return user;
};
