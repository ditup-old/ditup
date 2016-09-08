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

    return co(function * () {
      let cursor = yield db.query(query, params);
      let output = yield cursor.all();

      if(output.length === 0) {
        let err = new Error('User Not Found');
        err.status = 404;
        throw err;
      }

      if(output.length > 1) {
        throw new Error('database corruption: username is not unique');
      }

      return output[0];
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
        FOR u IN users
          FILTER u.account.email.verified == true && u.account.active_account == true
          SORT u.account.join_date DESC
          LIMIT @limit
          RETURN u
        `;
      let params = {limit: limit};

      let cursor = yield db.query(query, params);
      return yield cursor.all();
    });
  }

  user.random = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.count = options.limit.count || 1;

    return co(function * () {
      var query=`
        FOR u IN users
          FILTER u.account.email.verified == true && u.account.active_account == true
          ${options.username ? 'FILTER u.username != @username' : ''} //filter out username so we don't show the logged user in the list
          SORT RAND()
          LIMIT @count
          RETURN u`;

      var params = {
        count: options.limit.count
      };

      if(options.username) params.username = options.username;

      let cursor = yield db.query(query, params);
      return yield cursor.all();
    });
  };

  /*
   * list of people last online
   * TODO now it's only last login. last online or online now is other challenge.
   *
   *
   */
  user.lastOnline = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.count = options.limit.count || 5;

    return co(function * () {
      var query=`
        FOR u IN users
          FILTER u.account.email.verified == true && u.account.active_account == true
          ${options.username ? 'FILTER u.username != @username' : ''} //filter out username so we don't show the logged user in the list
          SORT u.account.last_login DESC
          LIMIT @count
          RETURN u`;

      //TODO this is just last login. we can improve it by updating user's last_online with every request.
      //we can even ping server with ajax to mark user as online.

      var params = {
        count: options.limit.count
      };

      if(options.username) params.username = options.username;

      let cursor = yield db.query(query, params);
      return yield cursor.all();
    });
  };
  
  /**
   * find often followed people
   *
   */
  user.popular = function () {}

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
      create_date: data.create_date || Date.now(),
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

    return co(function * () {
      try{
        let cursor = yield db.query(query, params);
      }
      catch(e){
        if(e.code === 409 && e.errorNum === 1210) {
          let err = new Error('duplicit email');
          err.status = 409;
          throw err;
        }
        throw (e);
      }

      return;
    });
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
    let username = typeof(user) === 'string' ?  user : user.username;
    let tagname = typeof(tag) === 'string' ? tag : tag.name || tag.tagname;
    var query = 'FOR x IN users FILTER x.username == @username LET from = x._id ' +
      'FOR y IN tags FILTER y.name == @name LET to = y._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to), created: @created } IN userTag';
    return db.query(query, {username: username, name: tagname, created: Date.now()})
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) throw new Error('404');
        if (writes === 1) return {success: true};
        throw new Error('problems with adding tag');
      });
  };

  user.tags = function (username) {
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'FOR ut IN userTag FILTER ut._from == u._id ' +
      'FOR t IN tags FILTER t._id == ut._to ' +
      'RETURN {name: t.name, description: t.description}';
    return db.query(query, {username: username})
      .then(function (cursor) {
        return cursor.all();
      });
  };

  user.removeTag = function (username, tagname) {
    return co(function * () {
      var query = 'FOR u IN users FILTER u.username == @username ' +
        'FOR t IN tags FILTER t.name == @tagname ' +
        'FOR ut IN userTag FILTER u._id == ut._from && t._id == ut._to ' +
        'REMOVE ut IN userTag';
      let cursor = yield db.query(query, {username: username, tagname: tagname});
      var writes = cursor.extra.stats.writesExecuted;
      if (writes === 0) throw new Error('404');
      if (writes === 1) return;
      throw new Error('problems with removing tag (that should never happen)');
    });
  };

  user.follow = function (follower, followed) {
    return co(function * () {
      if(follower === followed) throw new Error('follower === followed, Bad Data');

      var query = `FOR follower IN users FILTER follower.username == @follower
        FOR followed IN users FILTER followed.username == @followed
          INSERT {_from: follower._id, _to: followed._id, unique: CONCAT(follower._id, '-', followed._id), created: @created}
          IN userFollowUser
          RETURN NEW`;
      var params = {follower: follower, followed: followed, created: Date.now()};

      let cursor = yield db.query(query, params);
      let output = yield cursor.all();

      if(output.length === 0) throw new Error('404');
      if(output.length > 1) throw new Error('found more than one user. this should never happen');
      return;
    });
  };

  user.unfollow = function (follower, followed) {
    return co(function * () {
      if(follower === followed) throw new Error('follower === followed, Bad Data');

      var query = `FOR follower IN users FILTER follower.username == @follower
        FOR followed IN users FILTER followed.username == @followed
          FOR ufu IN userFollowUser
            FILTER ufu._from == follower._id && ufu._to == followed._id
            REMOVE ufu IN userFollowUser
            RETURN OLD`;
      var params = {follower: follower, followed: followed};

      let cursor = yield db.query(query, params);
      let output = yield cursor.all();

      if(output.length === 0) throw new Error('404');
      if(output.length > 1) throw new Error('found more than one following. this should never happen');
      return;
    });
  };

  user.following = function (follower, followed) {
    return co(function * () {
      if(follower === followed) throw new Error('follower === followed, Bad Data');

      var query = `
        FOR follower IN users FILTER follower.username == @follower
          FOR followed IN users FILTER followed.username == @followed
            FOR ufu IN userFollowUser
              FILTER ufu._from == follower._id &&  ufu._to == followed._id
              RETURN ufu`;
      var params = {follower: follower, followed: followed};

      let cursor = yield db.query(query, params);
      let output = yield cursor.all();

      if(output.length > 1) throw new Error('found more than one following. this should never happen');
      if(output.length === 1) return true;
      return false;
    });
  };

  user.countFollowers = function (username){
    return co (function * () {
      var query = `
        FOR u IN users FILTER u.username == @username
            LET links = (FOR ufu IN userFollowUser
              FILTER ufu._to == u._id
              RETURN null)
            RETURN COUNT(links)`;
      var params = {username: username};

      let cursor = yield db.query(query, params);
      let output = yield cursor.all();
      if(output.length === 0) {
        let err = new Error('User Not Found');
        err.status = 404;
        throw err;
      }
      if(output.length > 1) {
        let err = new Error('Database problem: multiple similar usernames');
        throw err;
      }
      return output[0];
    });
  }

  return user;
};
