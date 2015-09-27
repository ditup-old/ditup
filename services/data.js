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
        if(users.length === 0) throw new Error('user ' + user.username + ' not found');
        if(users.length > 1) throw new Error('database corruption: username ' + user.username + ' is not unique');
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
  updateUserProfile: function (user, profile) {
    return db.query('FOR x IN users FILTER x.username == @username UPDATE x WITH {profile: @profile} IN users', {username: user.username, profile: profile});
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
    var query = 'FOR t IN tags ' +
      'FILTER LIKE(t.name, CONCAT("%", @string, "%"), true) ' +
      'RETURN t';
    var params = {string: string};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  },
  tag: {
    nameExists: function (name) {
      return db.query('FOR t IN tags FILTER t.name == @name ' +
        'COLLECT WITH COUNT INTO number ' +
        'RETURN number', {name: name})
        .then(function (cursor) {
          return cursor.all();
        })
        .then(function (output) {
          var number = output[0];
          if(number === 0) return false;
          else if (number === 1) return true;
          throw new Error('weird database error: more than 1 tag with unique name exists');
        });
    }
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
    var query = 'FOR x IN users FILTER x.username == @username LET from = x._id ' +
      'FOR y IN tags FILTER y.name == @name LET to = y._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to) } IN userTag';
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
    var query = 'FOR d IN dits FILTER d.url == @url LET from = d._id ' +
      'FOR t IN tags FILTER t.name == @name LET to = t._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to) } IN ditTag';
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
    var query = 'FOR d IN dits FILTER d.url == @url LET to = d._id ' +
      'FOR u IN users FILTER u.username == @username LET from = u._id ' +
      'INSERT {_from: from, _to: to, unique: CONCAT(from, "-", to), relation: @rel} IN memberOf';
    return db.query(query, {url: dit.url, username: user.username, rel: relation});
      //.then(function (cursor) {
      //  console.log(cursor);
      //  //return cursor.extra.stats.writesExecuted === 1 ? true : false;
      //});
  },
  get createUserDit () {
    return this.addUserToDit;
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
 
    return db.query(query, params);
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
      'FOR ud IN memberOf FILTER u._id == ud._from && d._id == ud._to && ud.relation == @rel' +
      'REMOVE ud IN memberOf';

    var params = relation === undefined
    ? {url: dit.url, username: user.username}
    : {url: dit.url, username: user.username, rel: relation};
;

    return db.query(query, params);
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
