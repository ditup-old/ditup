'use strict';

let co = require('co');
let express = require('express');

module.exports = function (collection, dependencies) { 
  let router = express.Router();

  router.get('/:username/'+collection+'s', function (req, res, next) {
    let data = req.app.get('database');
    var username = req.params.username;
    var sessUser = req.session.user;

    return co(function *() {
      if(username === sessUser.username) {
        let following = yield data[collection].following(username);
        let commonTags = yield data[collection][collection+'sByTagsOfUser'](username);
        return res.render('user-'+collection+'s', {session: sessUser, user: {username: username}, following: following, commonTags: commonTags});
      }
      else{
        throw new Error('not implemented');
      }
    })
    .catch(function (err) {
      return next(err);
    });
  });

  return router;
};
