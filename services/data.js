'use strict';

var Database = require('arangojs');

var config = require('./db-config');

var db = new Database({url: config.url, databaseName: config.dbname});
//var graph = db.graph('ditg');

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
  /**
   * Reads user from arangodb by username (default) or email
   * @param {Object} user
   * @param {string} [user.username] either username or email is required
   * @param {string} [user.email]
   * @returns {Object|null} 
   */
  readUser: function (user) {
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
  },
  searchUsers: function (string) {
    var query = 'FOR u IN users ' +
      'FILTER LIKE(u.username, CONCAT("%", @string, "%"), true) ' +
      'RETURN {username: u.username}';
    var params = {string: string};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  },
  readUserProfile: function (user) {
    return db.query('FOR x IN users FILTER x.username == @username RETURN {profile: x.profile}', {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (users) {
        if(users.length === 1) return users[0];
        if(users.length === 0) return null; // throw new Error('user ' + user.username + ' not found');
        if(users.length > 1) throw new Error('database corruption: username ' + user.username + ' is not unique');
      });
  },
  readUserSettings: function (user) {
    return db.query('FOR u IN users FILTER u.username == @username RETURN {settings: u.settings}', {username: user.username})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (users) {
        if(users.length === 1) return users[0];
        if(users.length === 0) return null; //throw new Error('user ' + user.username + ' not found');
        if(users.length > 1) throw new Error('database corruption: username ' + user.username + ' is not unique');
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
  updateUserProfile: function (user, profile) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {profile: @profile} IN users', {username: user.username, profile: profile});
  },
  updateUserSettings: function (user, settings) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {settings: @settings} IN users', {username: user.username, settings: settings});
  },
  updateUserAccount: function (user, account) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {account: @account} IN users', {username: user.username, account: account});
  },
  updateUserEmailVerifyCode: function (user, data) {
    
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
  },
  updateUserEmailVerified: function (user, data) {
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
  },
  /**
   * @param {Object} user
   * @param {Object} data
   */
  updateUserResetPasswordCode: function (user, data) {
    
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
  },
  /**
   * @param {Object} user
   * @param {Object} data
   */
  updateUserPassword: function (user, login) {
    
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
  },
  ////D
  deleteUser: function (user) {
    return db.query('FOR u IN users FILTER u.username == @username REMOVE u IN users', {username: user.username});
  },
  //dit
  createDit: function (dit, creator) {
    var that = this;
    return db.query('INSERT @dit IN dits', {dit: dit})
      .then(function () {
        //add creator
        var query = 'FOR d IN dits FILTER d.url == @url LET to = d._id ' +
          'FOR u IN users FILTER u.username == @username LET from = u._id ' +
          'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to)} IN creatorOfDit';
        return db.query(query, {url: dit.url, username: creator.username});
      })
      .then(function (){
        //creator will become admin of dit
        return that.addUserToDit(creator, {url: dit.url}, 'admin');
      });
  },
  readDit: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url RETURN x', {url: dit.url})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (ditArray){
        var len = ditArray.length;
        console.log('*********', ditArray)
        if(len === 0) return null;
        if(len === 1) return ditArray[0];
        throw new Error('weird amount of dits ' + dit.url + ' found');
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
  urlExists: function (url) {
    return db.query('FOR x IN dits FILTER x.url == @url ' +
      'COLLECT WITH COUNT INTO number ' +
      'RETURN number', {url: url})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (output) {
        var number = output[0];
        if(number === 0) return false;
        else return true;
      });
  },
  updateDitProfile: function (dit, data) {
    //dittype is not stored in profile object, but in the root of json
    var dittype = data.dittype;
    var profile = {};
    //create profile without dittype (don't modify the original object)
    for(var name in data) {
      if(name !== 'dittype') profile[name] = data[name];
    }
    console.log('*************** dittype ************', dittype);
    console.log('*************** profile ************', profile);
    return db.query('FOR x IN dits FILTER x.url == @url UPDATE x WITH {dittype: @dittype, profile: @profile} IN dits', {url: dit.url, profile: profile, dittype: dittype});
  },
  updateDitSettings: function (dit, settings) {
    return db.query('FOR x IN dits FILTER x.url == @url UPDATE x WITH {settings: @settings} IN dits', {url: dit.url, settings: settings});
  },
  deleteDit: function (dit) {
    return db.query('FOR x IN dits FILTER x.url == @url REMOVE x IN dits', {url: dit.url});
  },
  //tag
  createTag: function (tag) {
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'INSERT {name: @name, description: @description, meta: {created: @created, creator: u._id}} IN tags';
    var params = {
      name: tag.name,
      description: tag.description,
      created: tag.meta.created,
      username: tag.meta.creator
    };
    return db.query(query, params);
      /*.then(null, function (err) {
        console.log('***********caught error************');
        if(err.errorNum === 1210){
          console.log('****************correct number***');
        }
        return false;
      });*/
  },
  readTag: function (tag) {
    return db.query('FOR x IN tags FILTER x.name == @name RETURN x', {name: tag.name})
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (tags){
        var len = tags.length;
        if(len === 0) return null;
        if(len === 1) return tags[0];
        throw new Error('weird amount of tags ' + tag.name + ' found');
      });
  },
  searchTags: function (string) {
    //TODO return number of tag uses
    var query = 'FOR t IN tags ' +
      'FILTER LIKE(t.name, CONCAT("%", @string, "%"), true) ' +
      'RETURN {name: t.name, description: t.description}';
    var params = {string: string};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  },
  updateTag: function (tag) {
    return db.query('FOR x IN tags FILTER x.name == @name UPDATE x WITH @tag IN tags', {name: tag.name, tag: tag});
  },
  deleteTag: function (tag) {
    return db.query('FOR x IN tags FILTER x.name == @name REMOVE x IN tags', {name: tag.name});
  },
  //talk TODO 
  ///C
  createTalk: function (talk) {
  },
  //RUD

  //tag-user
  addTagToUser: function (tag, user) {
    var query = 'FOR x IN users FILTER x.username == @username LET from = x._id ' +
      'FOR y IN tags FILTER y.name == @name LET to = y._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to) } IN userTag';
    return db.query(query, {username: user.username, name: tag.name})
      .then(function (cursor) {
        console.log(cursor);
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) return {success: false, err: 'tag not found'};
        if (writes === 1) return {success: true};
        throw new Error('problems with adding tag');
      });
  },
  readTagsOfUser: function (user) {
    var query = 'FOR u IN users FILTER u.username == @username ' +
      'FOR ut IN userTag FILTER ut._from == u._id ' +
      'FOR t IN tags FILTER t._id == ut._to ' +
      'RETURN {name: t.name, description: t.description}';
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
    return db.query(query, {username: user.username, name: tag.name})
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) return {success: false, err: 'user doesn\'t have this tag'};
        if (writes === 1) return {success: true};
        throw new Error('problems with removing tag (this should never happen)');
      });
  },
  //tag-dit
  addTagToDit: function (tag, dit) {
    var query = 'FOR d IN dits FILTER d.url == @url LET from = d._id ' +
      'FOR t IN tags FILTER t.name == @name LET to = t._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to) } IN ditTag';
    return db.query(query, {url: dit.url, name: tag.name})
      .then(function (cursor) {
        console.log(cursor);
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) return {success: false, err: 'dit or tag not found'};
        if (writes === 1) return {success: true};
        throw new Error('problems with adding tag');
      });
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
    return db.query(query, {url: dit.url, name: tag.name})
      .then(function (cursor) {
        console.log(cursor);
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) return {success: false, err: 'dit doesn\'t have the tag'};
        if (writes === 1) return {success: true};
        throw new Error('problems with adding tag');
      });
  },
  //user-dit
  addUserToDit: function (user, dit, relation) {
    var query = 'FOR d IN dits FILTER d.url == @url LET to = d._id ' +
      'FOR u IN users FILTER u.username == @username LET from = u._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to), relation: @rel} IN memberOf';
    return db.query(query, {url: dit.url, username: user.username, rel: relation})
      .then(function (cursor) {
        console.log(cursor);
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) return {success: false, err: 'no success with adding'};
        if (writes === 1) return {success: true};
        throw new Error('problems with creating user (maybe some relation already exists or other error)');
      });
      //.then(function (cursor) {
      //  console.log(cursor);
      //  //return cursor.extra.stats.writesExecuted === 1 ? true : false;
      //});
  },
  get createUserDit () {
    return this.addUserToDit;
  },
  readUsersOfDit: function (dit, relations) {
    var relIsArray = Array.isArray(relations);
    var query = relIsArray
      ? 'FOR d IN dits FILTER d.url == @url ' +
        'FOR ud IN memberOf FILTER ud._to == d._id && ud.relation IN @rels ' +
        'FOR u IN users FILTER u._id == ud._from ' +
        'RETURN {user: u, relation: ud.relation}'
      : 'FOR d IN dits FILTER d.url == @url ' +
        'FOR ud IN memberOf FILTER ud._to == d._id ' +
        'FOR u IN users FILTER u._id == ud._from ' +
        'RETURN {user: u, relation: ud.relation}';
    var params = relIsArray
      ? {url: dit.url, rels: relations}
      : {url: dit.url};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  },
  readDitsOfUser: function (user, relations) {
    var relIsArray = Array.isArray(relations);
    var query = relIsArray 
      ? 'FOR u IN users FILTER u.username == @username ' +
        'FOR ud IN memberOf FILTER ud._from == u._id && ud.relation IN @rels ' +
        'FOR d IN dits FILTER d._id == ud._to ' +
        'RETURN {dit: d, relation: ud.relation}'
      
      : 'FOR u IN users FILTER u.username == @username ' +
        'FOR ud IN memberOf FILTER ud._from == u._id ' +
        'FOR d IN dits FILTER d._id == ud._to ' +
        'RETURN {dit: d, relation: ud.relation}';
    var params = relIsArray
      ? {username: user.username, rels: relations}
      : {username: user.username};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  },
  readMemberOf: function (user, dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'RETURN ud';
    return db.query(query, {url: dit.url, username: user.username})
      .then(function (cursor) {
        return cursor.all()
      })
      .then(function (results) {
        if(results.length === 0) return null;
        if(results.length === 1) return results[0];
        throw new Error('strange amount of relations or other error');
      });
  },
  readUserDit: function (user, dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'RETURN {user: u, dit: d, relation: ud}';
    return db.query(query, {url: dit.url, username: user.username})
      .then(function (cursor) {
        return cursor.all()
      })
      .then(function (results) {
        if(results.length === 0) return null;
        if(results.length === 1) return results[0];
        throw new Error('strange amount of relations or other error');
      });
  },
  updateUserDit: function (user, dit, relation, oldRelation) {
    var query = oldRelation === undefined
      ? 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'UPDATE ud WITH {relation: @rel} IN memberOf'
      : 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to && ud.relation == @oldRel ' +
      'UPDATE ud WITH {relation: @rel} IN memberOf';
    var params = oldRelation === undefined
      ? {url: dit.url, username: user.username, rel: relation}
      : {url: dit.url, username: user.username, rel: relation, oldRel: oldRelation}
 
    return db.query(query, params)
      .then(function (cursor) {
        console.log(cursor);
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) return {success: false, err: 'no relation to update'};
        if (writes === 1) return {success: true};
        throw new Error('problems with updating relation');
      });
  },
  upsertUserDit: function (user, dit, relation) {
    var query = 
      'FOR u IN users FILTER u.username == @username ' +
        'LET from = u._id ' +
      'FOR d IN dits FILTER d.url == @url ' +
        'LET to = d._id ' +
      'UPSERT {_from: from, _to: to} ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to), relation: @rel} ' +
      'UPDATE {relation: @rel} ' +
        'IN memberOf';
    return db.query(query, {username: user.username, url: dit.url, rel: relation});
  },
  deleteUserFromDit: function (user, dit, relation) {
    //relation is optional argument
    var query = relation === undefined
      ? 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to ' +
      'REMOVE ud IN memberOf'
      :'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to && ud.relation == @rel ' +
      'REMOVE ud IN memberOf';

    var params = relation === undefined
    ? {url: dit.url, username: user.username}
    : {url: dit.url, username: user.username, rel: relation};
;

    return db.query(query, params)
      .then(function (cursor) {
        console.log(cursor);
        var writes = cursor.extra.stats.writesExecuted;
        if (writes === 0) return {success: false, err: 'no relation to remove'};
        if (writes === 1) return {success: true};
        throw new Error('problems with removing user');
      });
  },
  isMember: function (user, dit) {
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
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
    var query = 'FOR d IN dits FILTER d.url == @url ' +
      'FOR u IN users FILTER u.username == @username ' +
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


module.exports.search = require('./data/search')(db);
module.exports.feedback = require('./data/feedback')(db);
module.exports.user = require('./data/user')(db);
module.exports.dit = require('./data/dit')(db);
module.exports.tag = require('./data/tag')(db);
module.exports.talk = require('./data/talk')(db);
module.exports.discussion = require('./data/discussion')(db);
