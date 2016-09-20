'use strict';

let co = require('co');

module.exports = function (db) {
  var tag = {};

  tag.create = function (tag) {
    var query = `
      FOR u IN users FILTER u.username == @username
        INSERT {tagname: @tagname, name: @tagname, description: @description, meta: {created: @created, creator: u._id}} IN tags
    `;
    var params = {
      tagname: tag.tagname || tag.name,
      description: tag.description,
      created: tag.meta.created || Date.now(),
      username: tag.meta.creator
    };
    return db.query(query, params);
      /*.then(null, function (err) {
        if(err.errorNum === 1210){
        }
        return false;
      });*/
  };

  tag.read = function (tagname) {
    return co(function * () {
      let cursor = yield db.query('FOR x IN tags FILTER x.tagname == @tagname RETURN x', {tagname: tagname});
      let tags = yield cursor.all();

      var len = tags.length;
      if(len === 0) {
        let err = new Error('Not Found');
        err.status = 404;
        throw err;
      }
      if(len === 1) return tags[0];
      throw new Error(`weird amount of tags ${tagname} found`);
    });
  }

  tag.update = function (tagname, data) {
    return db.query('FOR t IN tags FILTER t.tagname == @tagname UPDATE t WITH @data IN tags', {tagname: tagname, data: data});
  },
  /**
   * 
   *
   */
  tag.nameExists = function (name) {
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

  tag.exists = tag.nameExists;

  /**
   * @param {Object} [options={}]
   * @returns {Promise}
   *
   */
  tag.count = function(options) {
    var options = options || {};
      
    var query=`LET ts = LENGTH(FOR t IN tags RETURN null)
      LET ut = LENGTH(FOR ut IN userTag RETURN null)
      LET dt = 0 //LENGTH(FOR dt IN ditTag RETURN null)
      RETURN {
        tagno: ts,
        usertagno: ut,
        dittagno: dt
      }`;
    var params = {};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //here we can do something with results
        return results[0];
      });
  };

  /**
   * @param {Object} [options]
   * @param {Object} [options.limit]
   * @param {number} [options.limit.offset=0]
   * @param {number} [options.limit.count=5]
   * @returns {Promise} tag[]
   */
  tag.newest = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.offset = options.limit.offset || 0;
    options.limit.count = options.limit.count || 5;

    var query=`FOR t IN tags
        SORT t.meta.created DESC
        LIMIT @offset, @count
        RETURN {name: t.name, description: t.description, created:t.meta.created}`;
    var params = {
      offset: options.limit.offset,
      count: options.limit.count
    };


    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //you can do something with results here
        return results;
      });
  };

  /**
   * in options: number of shown dits, limit, dittype or all
   * @param {Object} [options]
   * @param {Object} [options.limit]
   * @param {number} [options.limit.offset=0]
   * @param {number} [options.limit.count=5]
   * @returns {Promise} {name, description, userno, ditno, no}[]
   */
  tag.popular = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.offset = options.limit.offset || 0;
    options.limit.count = options.limit.count || 5;

    var query=`FOR t IN tags
      LET userLinks = LENGTH(FOR ut IN userTag FILTER ut._to == t._id RETURN null)
      LET ideaLinks = LENGTH(FOR pt IN ideaTag FILTER pt._to == t._id RETURN null)
      LET challengeLinks = LENGTH(FOR pt IN challengeTag FILTER pt._to == t._id RETURN null)
      LET projectLinks = LENGTH(FOR pt IN projectTag FILTER pt._to == t._id RETURN null)
      LET discussionLinks = LENGTH(FOR pt IN discussionTag FILTER pt._to == t._id RETURN null)
      LET links = userLinks + ideaLinks + challengeLinks + discussionLinks + projectLinks
      SORT links DESC
      LIMIT @offset, @count
      RETURN {
        name: t.name,
        description: t.description,
        userno: userLinks,
        no: links
      }`;

    var params = {
      offset: options.limit.offset,
      count: options.limit.count
    };


    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //you can do something with results here
        return results;
      });
  };

  /**
   * @param {Object} [options]
   * @param {Object} [options.limit]
   * @param {number} [options.limit.count=3]
   * @param {string} [options.dittype]
   * @returns {Promise} dit[] 
   */
  tag.random = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.count = options.limit.count || 3;

    var query=`FOR t IN tags
      SORT RAND()
      LIMIT @count
      RETURN {name: t.name, description: t.description}`;
    var params = {
      count: options.limit.count
    };


    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //you can do something with results here
        return results;
      });
  };

  tag.uses = function (tagname) {
    return co(function * () {
      let query = `FOR t IN tags FILTER t.tagname == @tagname
        LET usrs = (FOR ut IN userTag FILTER ut._to == t._id RETURN null)
        LET cls = (FOR ct IN challengeTag FILTER ct._to == t._id RETURN null)
        LET ids = (FOR it IN ideaTag FILTER it._to == t._id RETURN null)
        LET prs = (FOR pt IN projectTag FILTER pt._to == t._id RETURN null)
        LET dcs = (FOR dt IN discussionTag FILTER dt._to == t._id RETURN null)
        RETURN {
          users: COUNT(usrs),
          challenges: COUNT(cls),
          ideas: COUNT(ids),
          projects: COUNT(prs),
          discussions: COUNT(dcs),
          'all': COUNT(usrs) + COUNT(cls) + COUNT(ids) + COUNT(prs) + COUNT(dcs)
        }
        `;
      let params = {tagname: tagname};

      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      return out[0];
    });
  }

  tag.readUsers = function (tagname) {
    return co(function * () {
      /*
      let query = `
        FOR t IN tags FILTER t.tagname == @tagname
          FOR v IN 1..1
            INBOUND t
            userTag
            SORT RAND()
            RETURN KEEP(v, 'username', 'name', 'surname')
      `;
      // */
      //
      //get users and their other tags and sort users by amount of followers
      let query = `WITH users, tags
        FOR t IN tags FILTER t.tagname == @tagname
          LET users = (
            FOR v,e,p IN 1..2 ANY t
            INBOUND userTag, INBOUND userFollowUser
              COLLECT user = p.vertices[1] WITH COUNT INTO countFollowers
              RETURN {user: user, followerno: countFollowers-1}
          )
            
          FOR u IN users
            LET otherTags = (
                FOR v IN 1..1 OUTBOUND u.user
                OUTBOUND userTag
                  FILTER v._id != t._id
                  SORT v.tagname ASC
                  RETURN KEEP(v, 'tagname', 'description')
            )
            SORT u.followerno DESC
            RETURN MERGE(KEEP(u.user, 'username', 'profile'), {tags: otherTags}, {followerno: u.followerno})`;
      let params = {tagname: tagname};
      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      return out;
    });
  }

  tag.readCollections = function (tagname, collections) {
    let collection = collections.slice(0,-1);
    let upCollection = collection.charAt(0).toUpperCase() + collection.slice(1);
    return co(function * () {
      //get challenges and their other tags and sort challenges by amount of followers
      let query = `WITH tags, ${collections}, users
        //find the required tag
        FOR t IN tags FILTER t.tagname == @tagname
          //get the searched collections and their followers
          LET collections = (
            FOR v,e,p IN 1..2 ANY t
            INBOUND ${collection}Tag, INBOUND userFollow${upCollection}
              COLLECT col = p.vertices[1] WITH COUNT INTO countFollowers
              RETURN {col: col, followerno: countFollowers-1}
          )
          FOR c IN collections
            //get the other tags of each collection 
            LET otherTags = (
                FOR v IN 1..1 OUTBOUND c.col
                OUTBOUND ${collection}Tag
                  FILTER v._id != t._id
                  SORT v.tagname ASC
                  RETURN KEEP(v, 'tagname', 'description')
            )
            //sort collections by popularity (amount of followers)
            SORT c.followerno DESC
            RETURN MERGE(KEEP(c.col, 'name'), {id: c.col._key}, {tags: otherTags}, {followerno: c.followerno})`;
      let params = {tagname: tagname};
      let cursor = yield db.query(query, params);
      let out = yield cursor.all();
      return out;
    });
  };
  
  //making tag.read(SomeCollection) function
  //it reads the someCollection dits tagged with the tag :tagname
  for(let collections of ['challenges', 'ideas', 'projects', 'discussions']) {
    let upCols = collections.charAt(0).toUpperCase() + collections.slice(1);
    tag[`read${upCols}`] = function (tagname) {
      return this.readCollections(tagname, collections);
    }
  }

  tag.readRelatedTags = function (tagname) {
    //TODO add some options (limit etc.)
    //untested function
    let query = `WITH users, projects, discussions, ideas, challenges, tags, userTag, projectTag, challengeTag, ideaTag, discussionTag
      FOR t IN tags FILTER t.tagname == @tagname
        FOR v IN 2..2 ANY t
        userTag, projectTag, challengeTag, ideaTag, discussionTag
          COLLECT tagFinal = KEEP(v, 'tagname') WITH COUNT INTO relevance
          SORT relevance DESC
          RETURN MERGE(tagFinal, {relevance: relevance})`
    let params = {tagname: tagname};

    return co(function * () {
      let cursor = yield db.query(query, params);
      let out = cursor.all();
      return out;
    });
  }

  return tag;
};
