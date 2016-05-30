'use strict';

var proto = require('./proto');


module.exports = function (db) {
  var project = {};

  project.create = proto.create(['name', 'description', 'join', 'join_info'], 'projects', db);

  project.read = function (id) {
    var query = `FOR d IN projects FILTER d._key == @id
      LET creator = (FOR u IN users FILTER u._id == d.creator RETURN u)
      FOR c IN creator
        RETURN MERGE(d, {creator: {username: c.username}})`;

    var params = {id: id};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (discs) {
        if(discs.length === 1) {
          return discs[0];        }
        else if(discs.length === 0) {
          throw new Error(404);
        }
        else {
          throw new Error('duplicate project id. this should never happen.');
        }
      });
  };

  project.update = function () {
    throw new Error('TODO!');
  }; //TODO

  project.delete = proto.delete('projects', db);

  project.addTag = proto.addTag('projects', db);
  project.removeTag = proto.removeTag('projects', db);
  project.tags = proto.tags('projects', db);

  //comment
  project.addComment = proto.addComment('projects', db);

  project.readComment = function () {
    throw new Error('TODO!');
  };

  project.readComments = proto.readComments('projects', db);
  project.updateComment;
  project.removeComment = proto.removeComment('projects', db);

  project.follow = proto.follow('projects', db);
  project.hide = proto.hide('projects', db);
  project.following = proto.following('projects', db);
  project.followingUser = proto.followingUser('projects', db);
  project.followers = proto.followers('projects', db);
  project.countFollowers = proto.countFollowers('projects', db);
  project.unfollow = proto.unfollow('projects', db);
  project.unhide = proto.unhide('projects', db);
  project.readProjectsByTags = proto.readCollectionsByTags(['name', 'description'], 'projects', db);

  //********************membership functions
  project.addMember = function (id, username, status) {
    let allowedStates = ['joining', 'invited', 'member'];
    if(allowedStates.indexOf(status)<0) return Promise.reject('400');

    let query = `FOR p IN projects FILTER p._key == @id
      FOR u IN users FILTER u.username == @username
        INSERT {
          _from: p._id,
          _to: u._id,
          unique: CONCAT(p._id, '-', u._id),
          status: @status,
          created: @created
        } IN projectMember`;
    let params = {
      id: id,
      username: username,
      status: status,
      created: Date.now()
    };

    return db.query(query, params)
      .then(function (cursor) {
        var writes = cursor.extra.stats.writesExecuted;
        if(writes === 0) throw new Error('404');
        if(writes > 1) throw new Error('more than one tag added. This should never happen.');
      })
      .then(null, function (err) {
        if(err.code === 409) throw new Error('409');
        throw err;
      });
  }
  
  project.countMembers = function (id, status) {
    let allowedStates = ['joining', 'invited', 'member'];
    if(allowedStates.indexOf(status)<0) return Promise.reject('400');

    //console.log(id, status);

    let query = `LET pr = (FOR p IN projects FILTER p._key == @id RETURN p)
      LET pm = (FOR p IN pr
        FOR pm IN projectMember FILTER pm._from == p._id && pm.status == @status
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
        if(mno === 'duplicate') throw new Error('duplicate project id. this should never happen.');
        return mno;
      });
  };

  project.userStatus = function (id, username) {
    let query = `FOR u IN users FILTER u.username == @username
      FOR p IN projects FILTER p._key == @id
        FOR pm IN projectMember FILTER pm._from == p._id && pm._to == u._id
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
  //********************END

  return project;
};
