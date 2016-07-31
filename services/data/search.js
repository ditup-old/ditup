'use strict';


module.exports = function (db) {
  var search = {};

  /**
   *
   * @param {string[]} tagnames
   * @returns {Promise<Object[]>} returns array of found users
   */
  search.usersWithTags = function (tagnames) {
    if(Array.isArray(tagnames)!==true) throw new Error('bad function input');
    var query = `LET output = (FOR t IN tags FILTER t.name IN @tagnames
        FOR ut IN userTag FILTER ut._to == t._id
          FOR u IN users FILTER u._id == ut._from
          RETURN {user: u, tag: t})
      FOR pt IN output
        COLLECT usn = pt.user INTO ts = {name: pt.tag.name, description: pt.tag.description}
        LET tagno = LENGTH(ts)
        SORT tagno DESC, usn.account.last_login DESC
        LET user = {username: usn.username}
        RETURN {user: user, tags: ts, tagno: tagno}`;

    var params = {tagnames: tagnames};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  };

  /**
   * @param {Object} user
   * @param {string} user.username
   * @returns {Promise<Array.<Object>>} returns array of found users
   */
  search.usersWithTagsOfUser = function (user) {
    var query = `LET username = @username
      LET tagsOfUser = (FOR u IN users FILTER u.username == username
        FOR ut IN userTag FILTER ut._from == u._id
          FOR t IN tags FILTER t._id == ut._to
          RETURN t)
      LET output = (FOR t IN tagsOfUser
        FOR ut IN userTag FILTER ut._to == t._id
          FOR u IN users FILTER u._id == ut._from && u.username != username
          RETURN {user: u, tag: t})
      FOR pt IN output
        COLLECT usn = pt.user INTO tags = {name: pt.tag.name, description: pt.tag.description}
        LET tagno = LENGTH(tags)
        SORT tagno DESC, usn.account.last_login DESC
        LIMIT 5
        LET user = {username: usn.username}
        RETURN {user: user, tags: tags, tagno: tagno}`;

    var params = {username: user.username};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  };

  /**
   *
   * @param {string[]} tagnames
   * @returns {Promise<Object[]>} returns array of found dits
   */
  search.ditsWithTags = function (tagnames) {
    if(Array.isArray(tagnames)!==true) throw new Error('bad function input');
    var query = `LET output = (FOR t IN tags FILTER t.name IN @tagnames
        FOR dt IN ditTag FILTER dt._to == t._id
          FOR d IN dits FILTER d._id == dt._from
          RETURN {dit: d, tag: t})
      FOR pt IN output
        COLLECT ditt = pt.dit INTO ts = {name: pt.tag.name, description: pt.tag.description}
        LET tagno = LENGTH(ts)
        SORT tagno DESC
        LET dit = {url: ditt.url, dittype: ditt.dittype}
        RETURN {dit: dit, tags: ts, tagno: tagno}`;
    var params = {tagnames: tagnames};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
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
  search.ditsWithTagsOfUser = function (user) {
    var query = `LET username = @username
      LET tagsOfUser = (FOR u IN users FILTER u.username == username
      FOR ut IN userTag FILTER ut._from == u._id
        FOR t IN tags FILTER t._id == ut._to
        RETURN t)
      LET output = (FOR t IN tagsOfUser
        FOR dt IN ditTag FILTER dt._to == t._id
          FOR d IN dits FILTER d._id == dt._from
          RETURN {dit: d, tag: t})
      FOR pt IN output
        COLLECT ditt = pt.dit INTO tags = {name: pt.tag.name, description: pt.tag.description}
        LET tagno = LENGTH(tags)
        SORT tagno DESC
        LET dit = {url: ditt.url, dittype: ditt.dittype}
        RETURN {dit: dit, tags: tags, tagno: tagno}`;
    var params = {username: user.username};

    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  };

  /****
    TODO search??
    fulltext
    find dits that other people with similar tags like, follow, are in

  ****/
  return search;
};
