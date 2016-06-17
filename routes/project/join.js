'use strict';

var co = require('co');

module.exports = function (dependencies) {
  let router = dependencies.router;
  let db = dependencies.db;

  router.get('/:id/:url/join', function (req, res, next) {
    let sessUser = req.session.user;
    let id = req.params.id;
    
    //this is my first use of generator functions and co library to write synchronous-looking asynchronous code
    co(function *() {
      let weHaveDataAlready = req.ditup && req.ditup.project && req.ditup.project.name && req.ditup.project.join_info && req.ditup.project.id === id;
      let project = yield weHaveDataAlready ? Promise.resolve(req.ditup.project) : db.project.read(id);
      
      //find out whether user is involved (and additional data)
      if(sessUser.logged === true) {
        let involvement = yield db.project.userInvolved(id, sessUser.username);
        project.userStatus = involvement.status;
        if(involvement.status === 'joining') {
          project.joinRequest = involvement.request;
        }
      }

      return res.render('project-join', {session: sessUser, project});
    })
    .catch(function (err) {
      next(err);
    });
  });

  return router;
};

