'use strict';


module.exports = function (db) {
  var feedback = {};

  /**
   * @param {Object} data
   * @param {Object} data.from //user
   * @param {string} data.from.username
   * @param {boolean} [data.from.logged=false]
   * @param {string} [data.context]
   * @param {string} text
   * @returns {Promise}
   */
  feedback.create = function (data) {
    var logged = (data.from.logged === true) ? true : false;
    var context = data.context || '';
    var subject = data.subject || '';

    var loggedQuery = `FOR u IN users FILTER u.username == @username
      INSERT {
        from: {
          username: @username,
          id: u._id
        },
        subject: @subject,
        text: @text,
        context: @context,
        public: @public,
        timestamp: @timestamp
      } IN feedbacks`;

    var nologQuery = `INSERT {
        from: {
          username: @username
        },
        subject: @subject,
        email: @email,
        text: @text,
        context: @context,
        public: @public,
        timestamp: @timestamp
      } IN feedbacks`;
    
    var query = logged === true ? loggedQuery : nologQuery;

    var params = {
      username: data.from.username,
      email: data.email,
      subject: subject,
      context: context,
      text: data.text,
      public: data.public,
      timestamp: Date.now()
    };

    return db.query(query, params);
  };

  return feedback;
};
