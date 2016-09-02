'use strict';

var co = require('co');
var express = require('express');
var router = express.Router();

var db = require('../services/data');

//authorization of user. If not authorized, response with status 403.
router.all('/', function (req, res, next) {
  let sessUser = req.session.user;
  let username = req.params.username;
  if(sessUser.logged !== true) {
    let err = new Error('403 - not authorized');
    err.status = 403;
    return next(err);
  }
  return next();
});

//processing the notifications (either process or delete it)
router.post('/', function (req, res, next) {
  let sessUser = req.session.user;
  return co(function *() {
    //process notification makes it viewed and redirects to the notification url
    if(req.body['process-notification'] === 'process') {
      //get the notification id from the form
      let notificationId = req.body['notification-id'];
      //set notification in database to viewed
      let notification = yield db.notifications.view(notificationId, sessUser.username);
      //redirect to the url, which notification is pointing to
      return res.redirect(notification.url);
    }
    //delete notification - delete from database and show notification page (in next route)
    else if(req.body['process-notification'] === 'delete') {
      let notificationId = req.body['notification-id'];
      //deleting notification from database
      let notification = yield db.notifications.remove(notificationId, sessUser.username);
      next();
    }
    else{
      throw new Error('unrecognized POST request');
    }
  })
  .catch(next);
});

router.use(require('./count-notifications'));

router.all('/', function (req, res,next) {
  let sessUser = req.session.user;
  
  return co(function *() {
    let notifications = yield db.notifications.read(sessUser.username);
    return res.render('notifications', {session: sessUser, notifications: notifications});
  })
  .catch(next);
});

module.exports = router;
