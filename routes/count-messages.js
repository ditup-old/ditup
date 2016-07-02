'use strict';

//middleware to count messages

var co = require('co');
var express = require('express');
var router = express.Router();

var db = require('../services/data');


//authorize all
router.all('*', function (req, res, next) {
  let sessUser = req.session.user;
  if(sessUser.logged === true) {
    return co(function *() {
      let count = yield db.messages.countUnread(sessUser.username);
      sessUser.unreadMessagesCount = count;
      return next();
    })
    .catch((err) => {return next(err);});
  }
  return next();
});

module.exports = router;
