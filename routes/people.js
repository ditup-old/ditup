'use strict';

var express = require('express');
var router = express.Router();
var co = require('co');

router.get('/', function(req, res, next) {
  let sessUser = req.session.user;
  let db = req.app.get('database');
  return co(function * () {
    let count = yield db.user.count();
    
    let commonTags, newUsers, random, lastOnline, popular;

    let lists = {};

    if(sessUser.logged === true) {
      lists.commonTags = yield db.search.usersWithTagsOfUser(sessUser);
      lists.newUsers = yield db.user.newUsers();
      lists.random = yield db.user.random({username: sessUser.username});
      lists.lastOnline = yield db.user.lastOnline({username: sessUser.username});
      //TODO newUsers created time should be changed to ... time ago.
    }
    else {
      sessUser.messages.push('<a href="/login?redirect=">log in</a> to see more');
    }

    return res.render('people', {session: req.session.user, count: count, lists: lists});
  })
    .catch(next);
});

module.exports = router;
