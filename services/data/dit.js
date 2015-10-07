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
   *
   *
   *
   */
  dit.newest = function (options) {
  
  };

  /**
   * in options: number of shown dits, limit, dittype or all
   *
   *
   *
   *
   */
  dit.popular = function (options) {};

  /**
   * in options: number of shown dits, dittype or all
   *
   *
   *
   *
   */
  dit.random = function (options) {};

  return dit;
};
