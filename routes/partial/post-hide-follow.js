'use strict';

module.exports = function (collection, dependencies) {
  let router = dependencies.router;
  let db = dependencies.db;

  return router.post(['/:id/:url'], function (req, res, next) {
    let sessUser = req.session.user;
    let id = req.params.id;
    if(sessUser.logged === true) {
      if(req.body.submit === 'follow') {
        //return next();
        return db[collection].follow(id, sessUser.username)
          .then(function () {
            sessUser.messages.push('Now you follow the '+collection+'.');
            return next();
          })
          .then(null, next);
      }
      else if(req.body.submit === 'unfollow') {
        //return next();
        return db[collection].unfollow(id, sessUser.username)
          .then(function () {
            sessUser.messages.push('You don\'t follow the '+collection+' anymore.');
            return next();
          })
          .then(null, next);
      }
      else if(req.body.submit === 'hide') {
        //return next();
        return db[collection].hide(id, sessUser.username)
          .then(function () {
            sessUser.messages.push('The ' + collection + ' won\'t be shown in your search results anymore.');
            return next();
          })
          .then(null, next);
      }
      else if(req.body.submit === 'unhide') {
        //return next();
        return db[collection].unhide(id, sessUser.username)
          .then(function () {
            sessUser.messages.push('The ' + collection + ' will be shown in your search results again.');
            return next();
          })
          .then(null, next);
      }
      else {
        return next();
      }
    }
    else {
      return next();
    }
  });
};

