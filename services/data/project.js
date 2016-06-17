'use strict';

var proto = require('./proto');
var co = require('co');


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

  //******************** BEGIN membership functions
  project.addMember = function (id, username, status, specificParams) {
    let allowedStates = ['joining', 'invited', 'member'];
    if(allowedStates.indexOf(status)<0) return Promise.reject('400');
    specificParams = specificParams || {};

    let request = null;
    if(status === 'joining' && specificParams.hasOwnProperty('request')) {
      request = specificParams.request;
    }

    let query = `FOR p IN projects FILTER p._key == @id
      FOR u IN users FILTER u.username == @username
        INSERT {
          _from: p._id,
          _to: u._id,
          unique: CONCAT(p._id, '-', u._id),
          status: @status,
          created: @created,
          request: @request
        } IN projectMember`;
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
  
  /** which projects is user member of? **/
  project.userProjects = function (username, status) {
    status = status || 'all';
    let allowedStates = ['joining', 'invited', 'member'];
    allowedStates.push('all');
    if(allowedStates.indexOf(status)<0) return Promise.reject('400');

    let query, params;
    query = `LET usr = (FOR u IN users FILTER u.username == @username RETURN u) //find the user
      LET pr = (FOR u IN usr
        FOR pm IN projectMember FILTER pm._to == u._id && (`+ (status === 'all' ? 'true || ' : '') +`pm.status == @status)
          FOR pr IN projects FILTER pm._from == pr._id 
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
  

  //extended information about user involvement in project (like request message etc...)
  /**
   * 
   *
   * @return {status: status[, request: request]}
   */
  project.userInvolved = function (id, username) {
    let query = `FOR u IN users FILTER u.username == @username
      FOR p IN projects FILTER p._key == @id
        FOR pm IN projectMember FILTER pm._from == p._id && pm._to == u._id
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

  /**
   * @param {Object} user
   * @param {string} user.username
   * @returns {Promise<Array<Object>>} promise of Array of objects: [{dit: Object, tags: [Object]}]
   *
   *
   *
   */
  project.projectsByTagsOfUser = function (username, showHidden) {
    let showHiddenIsGood = showHidden === true || showHidden === false || showHidden === undefined;
    if(!showHiddenIsGood) return Promise.reject('400');
    var showHidden = showHidden === true ? true : false;
    

    var query = `LET usrs = (FOR u IN users FILTER u.username == @username
        RETURN u)
      LET tagsOfUser = (FOR u IN usrs
        FOR ut IN userTag FILTER ut._from == u._id
            FOR t IN tags FILTER t._id == ut._to
              RETURN t)
      LET output = (FOR t IN tagsOfUser
        FOR pt IN projectTag FILTER pt._to == t._id
          FOR p IN projects FILTER p._id == pt._from
            RETURN {project: p, tag: t})
      LET projs = (FOR pt IN output
        COLLECT proj = pt.project INTO tags = {name: pt.tag.name, description: pt.tag.description}
        LET tagno = LENGTH(tags)
        SORT tagno DESC
        //LET project = {id: proj._key, name: proj.name, _id: proj._id}
        RETURN {project: proj, tags: tags, tagno: tagno})
      
      //now finding out whether the project is hidden
      LET hip = (FOR p IN projs
        FOR u IN usrs
          LET hidden = (COUNT(FOR ufp IN userFollowProject FILTER u._id == ufp._from && p.project._id == ufp._to && ufp.hide == true RETURN ufp))
          RETURN {id: p.project._key, name: p.project.name, description: p.project.description, tags: p.tags, hidden: hidden})
          
      LET ret = (FOR h IN hip ` + (showHidden === true ? '' : 'FILTER h.hidden == 0') + ` RETURN h)
      RETURN COUNT(usrs)==0 ? '404' : (COUNT(usrs)>1 ? 'duplicate': ret)`;
    var params = {username: username};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (out) {
        //console.log(ret);
        return out[0];
      })
      .then(function (out) {
        if(out === '404') throw new Error('404');
        if(out === 'duplicate') throw new Error('duplicate');
        return out;
      });
  };
  //********************END
  project.popular = proto.popular('projects', db);
  project.newest = proto.newest('projects', db);
  project.random = proto.random('projects', db);

  return project;
};
