'use strict';

let co = require('co');
let router = require('express').Router();

router.post(['/:id/:url'], function (req, res, next) {
  let collection = req.baseUrl.substr(1);

  return co(function * () {
    let db = req.app.get('database');
    let sessUser = req.session.user;
    let id = req.params.id;
    if(sessUser.logged === true) {
      if(req.body.action === 'follow') {
        //return next();
        yield db[collection].follow(id, sessUser.username);
        sessUser.messages.push(`Now you follow the ${collection}.`);
      }
      else if(req.body.action === 'unfollow') {
        yield db[collection].unfollow(id, sessUser.username)
        sessUser.messages.push(`You don\`t follow the ${collection} anymore.`);
      }
      return next();
    }
    else {
      throw new Error('not authorized');
    }
  
  })
    .catch(next);
});

module.exports = router;

