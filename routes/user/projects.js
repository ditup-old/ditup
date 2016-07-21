'use strict';

let co = require('co');

module.exports = function (dependencies) { 
  let router = dependencies.router;
  let data = dependencies.data;

  router.get('/:username/projects', function (req, res, next) {
    var username = req.params.username;
    var sessUser = req.session.user;

    let involved, following, commonTags;

    if(username === sessUser.username) {
      return co(function *() {
        let involved = yield data.project.userProjects(username);
        let following = yield data.project.following(username);
        let commonTags = yield data.project.projectsByTagsOfUser(username);
        return res.render('user-projects', {session: sessUser, user: {username: username}, involved: involved, following: following, commonTags: commonTags});
      })
      .catch(next);
    }
    else next();
  });

  return router;
};
