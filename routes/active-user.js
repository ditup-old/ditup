'use strict';

let co = require('co');

module.exports = function (req, res, next) {
  let db = req.app.get('database');
  return co(function *() {
    let sessUser = req.session.user;
    if(sessUser.logged === true) yield db.user.updateAccount({username: sessUser.username}, {active: Date.now()});
    return next();
  })
  .catch(next);
};
