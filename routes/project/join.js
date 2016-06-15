'use strict';

module.exports = function (dependencies) {
  let router = dependencies.router;
  let db = dependencies.db;

  router.get('/:id/:url/join', function (req, res, next) {
    let sessUser = req.session.user;
    let project = {};

    res.render('project-join', {session: sessUser, project});
  });

  return router;
};

