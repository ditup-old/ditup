'use strict';

let co = require('co');

module.exports = function (collection, dependencies) { 
  let router = dependencies.router;
  let data = dependencies.data;

  router.get('/:username/'+collection+'s', function (req, res, next) {
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
