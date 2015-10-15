'use strict';


module.exports = function (db) {
  var talk = {};

  /**
   * @param {Object} talk
   * @param {string} [talk.topic]
   * @param {Object[]} talk.users[]
   * @param {string} talk.users[].username
   * @returns {Promise}
   */
  talk.create = function (talk) {
    var query = ``;
    var params = {};

    return db.query(query, params)
      .then(function (/*talk id or key*/) {
        var talkKey; //TODO!!
        //make sure usernames are unique
        var arrayUsernames = [];
        for (let un of talk.users) {
          arrayUsernames.push(un.username);
        }
        //values in set are unique
        var setUsernames = new Set(arrayUsernames);
        var promiseArray = [];
        var talk = {_key: talkKey};
        
        setUsernames.forEach(function (un1, un2) {
          var user = {username: un1};
          promiseArray.push(this.addUser(talk, user))
        }, this);
        return Promise.all(promiseArray);
      })
      .then(function (responseArray) {
        responseArray.forEach(function (index, value) {
          console.log(index, value);
        });
        return;
      });
  };

  /**
   * @param {Object} talk
   * @param {number} talk._key
   * @param {Object} user
   * @param {string} user.username
   * @returns {Promise}
   */
  talk.addUser = function (talk, user) {
    var query = `FOR t IN talks FILTER t._key == @key
      FOR u IN users FILTER u.username == @username
      
      INSERT {_from: u._id, _to: t._id, unique: CONCAT (u._id, '-', t._id)} INTO userTalk
      RETURN NEW`;
    var param = {
      key: talk._key,
      username: user.username
    };
  };

  /**
   * @param {Object} talk
   * @param {number} talk._key
   * @param {Object} message
   * @param {string} message.text
   * @param {Object} message.from Sender user
   * @param {string} message.from.username
   * @returns {Promise}
   */
  talk.addMessage = function (talk, message) {
  };

  /**
   * Return talk and its messages. If user is provided, messages will contain all unread messages (or some limit if provided (not to load hundreds of unread messages)).
   * @param {Object} talk
   * @param {number} talk._key
   * @param {Object} user
   * @param {string} user.username
   */
  talk.read = function (talk, user) {
  };

  /**
   * @param {Object} talk
   * @param {number} talk._key
   * @param {Object} [user]
   * @param {string} [user.username]
   */
  talk.readMessages = function (talk, user, options) {
    
  };

  /**
   * @param {Object} user
   * @param {string} user.username
   */
  talk.readTalksOfUser = function (user) {
    var query = `
      LET ts = (FOR u IN users FILTER u.username == @username
        FOR ut IN userTalk FILTER ut._from == u._id//filters?
          FOR t in talks FILTER t._id == ut._to
            RETURN t)
      FOR t IN ts
        //get only messages interesting (i.e.only last message)
          LET mes = (FOR m IN t.messages
            SORT m.sent DESC
            LIMIT 0,1
            RETURN m)
        //POPULATE from of each message
        LET mesu = (FOR m IN mes
          FOR u IN users FILTER u._id == m.from
          RETURN MERGE(m, {from:{username: u.username}}))
        LET users = (FOR ut IN userTalk FILTER t._id == ut._to
          FOR u IN users FILTER u._id == ut._from
            RETURN {username: u.username})
        RETURN {
          talk: MERGE(t, {messages: mesu}),
          users: users
        }`
    var params = {username: user.username};
    return db.query(query, params)
      .then(function (cursor) {
        return cursor.all();
      });
  };

  talk.countUnreadMessages = function (user) {
    //it means getting all tags and for each of them count all messages which appeared after last user view.
  };

  return talk;
};
