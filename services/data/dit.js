'use strict';


module.exports = function (db) {
  var dit = {};

  /**
   * @param {Object} [options={}]
   * @param {string} [options.dittype]
   * @returns {Promise}
   *
   */
  dit.count = function(options) {
    var options = options || {};
    var query;
    var params;

    if(!options.dittype){
      query=`LET dt = (FOR d IN dits FILTER true RETURN {url: d.url, dittype: d.dittype})
        LET all = LENGTH(dt)
        FOR d IN dt
        COLLECT dittype = d.dittype INTO dts = d.url
        LET num = LENGTH(dts)
        SORT num DESC
        RETURN {
          dittype: dittype,
          no: num,
          all: all
        }`;
      params = {};
    }
    else {
      query=`LET dt = (FOR d IN dits FILTER d.dittype == @dittype RETURN d)
        RETURN LENGTH(dt)`;
      params = {dittype: options.dittype};
    }

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        var ret = {};
        ret.all = results[0] ? results[0].all : 0;
        for(let result of results){
          ret[result.dittype || 'dit'] = result.no;
        }

        return ret;
      });
  
  };

  /**
   * in options: number of shown dits, limit, dittype or all
   * @param {Object} [options]
   * @param {Object} [options.limit]
   * @param {number} [options.limit.offset=0]
   * @param {number} [options.limit.count=5]
   * @param {string} [options.dittype]
   * @returns {Promise} dit[]
   */
  dit.newest = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.offset = options.limit.offset || 0;
    options.limit.count = options.limit.count || 5;

    var query;
    var params = {
      offset: options.limit.offset,
      count: options.limit.count
    };

    if(options.dittype === undefined){
      query=`LET dd = (FOR d IN dits FILTER true
          RETURN d)
        FOR d IN dd
          SORT d.created DESC
          LIMIT @offset, @count
          RETURN {url: d.url, dittype: d.dittype, created:d.created}`;
    }
    else {
      query=`LET dd = (FOR d IN dits FILTER d.dittype == @dittype
          RETURN d)
        FOR d IN dd
          SORT d.created DESC
          LIMIT @offset, @count
          RETURN {url: d.url, dittype: d.dittype, created:d.created}`;
      params.dittype = options.dittype === 'dit' ? null : options.dittype || null;
    }

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
   * @param {string} [options.dittype]
   * @param {string[]} [options.relations=['member','admin']] array of relations types to count to popularity
   * @returns {Promise} [{dit: {url: string, dittype: string}, relno: number}] 
   */
  dit.popular = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.offset = options.limit.offset || 0;
    options.limit.count = options.limit.count || 5;
    options.relations = options.relations || ['member', 'admin'];

    var query;
    var params = {
      rels: options.relations,
      offset: options.limit.offset,
      count: options.limit.count
    };

    if(!options.dittype){
      query=`LET out = (FOR d IN dits FILTER true
          FOR ud IN memberOf FILTER ud._to == d._id && ud.relation IN @rels
            RETURN {dit:d, rel:ud.relation})
        FOR o IN out
          COLLECT oo = o.dit WITH COUNT INTO relno
          SORT relno DESC
          LIMIT @offset, @count
          RETURN {
            dit: {url: oo.url, dittype: oo.dittype},
            relno: relno
          }`;
    }
    else {
      query=`LET out = (FOR d IN dits FILTER d.dittype == @dittype
          FOR ud IN memberOf FILTER ud._to == d._id && ud.relation IN @rels
            RETURN {dit:d, rel:ud.relation})
        FOR o IN out
          COLLECT oo = o.dit WITH COUNT INTO relno
          SORT relno DESC
          LIMIT @offset, @count
          RETURN {
            dit: {url: oo.url, dittype: oo.dittype},
            relno: relno
          }`;
      params.dittype = options.dittype === 'dit' ? null : options.dittype || null;
    }

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
   * @param {number} [options.limit.count=1]
   * @param {string} [options.dittype]
   * @returns {Promise} dit[] 
   */
  dit.random = function (options) {
    var options = options || {};
    options.limit = options.limit || {};
    options.limit.count = options.limit.count || 1;

    var query;
    var params = {
      count: options.limit.count
    };

    if(options.dittype === undefined){
      query=`FOR d IN dits
        SORT RAND()
        LIMIT @count
        RETURN {url: d.url, dittype: d.dittype}`;
    }
    else {
      query=`FOR d IN dits FILTER d.dittype == @dittype
        SORT RAND()
        LIMIT @count
        RETURN {url: d.url, dittype: d.dittype}`;
      params.dittype = options.dittype === 'dit' ? null : options.dittype || null;
    }
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      })
      .then(function (results) {
        //you can do something with results here
        return results;
      });
  };

  return dit;
};
