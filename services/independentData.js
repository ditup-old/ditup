'use strict';

module.exports = function independentData(dependencies) {
  var db = dependencies.db;
  //submodules to also export as a part of the object
  var modules = ['user', 'tag', 'discussion', 'challenge', 'idea', 'project', 'messages', 'notifications', 'search'];
  var exports = {};

  for (let md of modules) {
    exports[md] = require('./data/'+md)(db);
  }

  var that = exports;

  var moreExports = {
    //user
    ////C
    createUser: that.user.create,

    ////R
    /**
     * Reads user from arangodb by username (default) or email
     * @param {Object} user
     * @param {string} [user.username] either username or email is required
     * @param {string} [user.email]
     * @returns {Object|null} 
     */
    readUser: that.user.read,
    searchUsers: that.user.search,
    readUserProfile: that.user.readProfile,
    readUserSettings: that.user.readSettings,
    usernameExists: that.user.usernameExists,
    emailExists: that.user.emailExists,
    ////U
    updateUserProfile: that.user.updateProfile,
    updateUserSettings: that.user.updateSettings,
    updateUserAccount: that.user.updateAccount,
    updateUserEmailVerifyCode: that.user.updateEmailVerifyCode,
    updateUserEmailVerified: that.user.updateEmailVerified,
    /**
     * @param {Object} user
     * @param {Object} data
     */
    updateUserResetPasswordCode: that.user.updateResetPasswordCode,
    /**
     * @param {Object} user
     * @param {Object} data
     */
    updateUserPassword: that.user.updatePassword,
    ////D
    deleteUser: that.user.delete,

    addTagToUser: function (tag, user) {
      return that.user.addTag(user, tag);
    },
    //dit
    createDit: function (dit, creator) {
      var that = that;
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
      return db.query('FOR x IN dits FILTER x.url == @url UPDATE x WITH {dittype: @dittype, profile: @profile} IN dits', {url: dit.url, profile: profile, dittype: dittype});
    },

    updateDitSettings: function (dit, settings) {
      return db.query('FOR x IN dits FILTER x.url == @url UPDATE x WITH {settings: @settings} IN dits', {url: dit.url, settings: settings});
    },
    deleteDit: function (dit) {
      return db.query('FOR x IN dits FILTER x.url == @url REMOVE x IN dits', {url: dit.url});
    },
    //tag
    createTag: that.tag.create,
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
    deleteTagFromUser: function (tag, user) {
      var query = 'FOR u IN users FILTER u.username == @username ' +
        'FOR t IN tags FILTER t.name == @name ' +
        'FOR ut IN userTag FILTER u._id == ut._from && t._id == ut._to ' +
        'REMOVE ut IN userTag';
      return db.query(query, {username: user.username, name: tag.name})
        .then(function (cursor) {
          var writes = cursor.extra.stats.writesExecuted;
          if (writes === 0) return {success: false, err: 'user doesn\'t have that tag'};
          if (writes === 1) return {success: true};
          throw new Error('problems with removing tag (that should never happen)');
        });
    },
    //tag-dit
    addTagToDit: function (tag, dit) {
      var query = 'FOR d IN dits FILTER d.url == @url LET from = d._id ' +
        'FOR t IN tags FILTER t.name == @name LET to = t._id ' +
        'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to) } IN ditTag';
      return db.query(query, {url: dit.url, name: tag.name})
        .then(function (cursor) {
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
          var writes = cursor.extra.stats.writesExecuted;
          if (writes === 0) return {success: false, err: 'no success with adding'};
          if (writes === 1) return {success: true};
          throw new Error('problems with creating user (maybe some relation already exists or other error)');
        });
        //.then(function (cursor) {
        //  //return cursor.extra.stats.writesExecuted === 1 ? true : false;
        //});
    },
    get createUserDit () {
      return that.addUserToDit;
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

      return db.query(query, params)
        .then(function (cursor) {
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

  for(let prop in moreExports) {
    exports[prop] = moreExports[prop];
  }

  return exports;
}
