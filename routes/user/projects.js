'use strict';

module.exports = function (dependencies) { 
  let router = dependencies.router;
  let data = dependencies.data;

  router.get('/:username/projects', function (req, res, next) {
    var username = req.params.username;
    var sessUser = req.session.user;

    let involved;

    if(username === sessUser.username) {
      return data.project.userProjects(username)
        .then(function (_inv) {
          involved = _inv;
        })
        .then(function () {
          return res.render('user-projects', {session: sessUser, user: {username: username}, involved: involved, following: [], suggestedByCommonTags: []});
        })
        .then(null, function (err) {
          return next(err);
        });
    }

  });

  return router;
};
