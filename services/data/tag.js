'use strict';


module.exports = function (db) {
  var tag = {};

  tag.create = function (tag) {
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
        if(err.errorNum === 1210){
        }
        return false;
      });*/
  };

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

  /**
   * @param {Object} [options={}]
   * @returns {Promise}
   *
   */
  tag.count = function(options) {
    var options = options || {};
      
    var query=`LET ts = LENGTH(FOR t IN tags RETURN null)
      LET ut = LENGTH(FOR ut IN userTag RETURN null)
      LET dt = LENGTH(FOR dt IN ditTag RETURN null)
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
      LET userLinks = LENGTH(FOR ut IN userTag FILTER ut._to == t._id RETURN ut._id)
      LET ditLinks = LENGTH(FOR dt IN ditTag FILTER dt._to == t._id RETURN dt._id)
      LET links = userLinks + ditLinks
      SORT links DESC
      LIMIT @offset, @count
      RETURN {
        name: t.name,
        description: t.description,
        userno: userLinks,
        ditno: ditLinks,
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

  return tag;
};
