'use strict';

var express = require('express');
var router = express.Router();
var rights = require('../services/rights');
var database = require('../services/data');

//check if user is logged in (otherwise throw error);
router.all('*', function(req, res, next) {
  var sessUser = req.session.user;
  if (sessUser.logged === true) return next();
  var err = new Error('you need to log in to continue');
  return next(err);
});


//admin of dit to user
router.post(['/dit/:url/invite-user', '/invite-user-to-dit'], function (req, res, next) {
  //check if user has rights to invite to dit
  //then invite only if there is no relation between user and dit
  var url = req.params.url || req.body.url;
  var username = req.body.username;
  var sessUser = req.session.user;
  
  //check rights of sessUser to dit
  return database.readUserDit({username: sessUser.username},{url: url})
    .then(function (data) {
      var canEdit = rights.dit.addUser(data.user, data.dit, data.relation.relation);
      if (canEdit !== true) throw new Error('you don\'t have rights to add users to this dit');
      return database.createUserDit({username: username}, {url: url}, 'invited');
    })
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });

});

router.post(['/dit/:url/invite-user/cancel', '/invite-user-to-dit/cancel'], function (req, res, next) {
  //check if user has rights to invite to dit
  //then cancel only if there is invited relation existent
  var url = req.params.url || req.body.url;
  var username = req.body.username;
  var sessUser = req.session.user;
  
  //check rights of sessUser to dit
  return database.readUserDit({username: sessUser.username},{url: url})
    .then(function (data) {
      var canEdit = rights.dit.addUser(data.user, data.dit, data.relation.relation);
      if (canEdit !== true) throw new Error('you don\'t have rights to add users to this dit');
      return database.deleteUserFromDit({username: username}, {url: url}, 'invited');
    })
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post(['/dit/:url/accept-user', '/accept-user-to-dit'], function (req, res, next) {
  //check if user has rights to accept another user
  //then if join relation exists, change it to accepted
  var url = req.params.url || req.body.url;
  var username = req.body.username;
  var sessUser = req.session.user;
  
  //check rights of sessUser to dit
  return database.readUserDit({username: sessUser.username},{url: url})
    .then(function (data) {
      var canEdit = rights.dit.addUser(data.user, data.dit, data.relation.relation);
      if (canEdit !== true) throw new Error('you don\'t have rights to add users to this dit');
      return database.updateUserDit({username: username}, {url: url}, 'member', 'join');
    })
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post(['/dit/:url/not-accept-user', '/not-accept-user-to-dit'], function (req, res, next) {
  //check if user has rights to accept another user
  //then if join relation exists, delete it.
  var url = req.params.url || req.body.url;
  var username = req.body.username;
  var sessUser = req.session.user;
  
  //check rights of sessUser to dit
  return database.readUserDit({username: sessUser.username},{url: url})
    .then(function (data) {
      var canEdit = rights.dit.addUser(data.user, data.dit, data.relation.relation);
      if (canEdit !== true) throw new Error('you don\'t have rights to add users to this dit');
      return database.deleteUserFromDit({username: username}, {url: url}, 'join');
    })
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });
});

//user joining, accepting or declining invitation
router.post(['/dit/:url/join', '/join-dit'], function (req, res, next) {
  //if there is no relation and user can join, create join relation (it still has to wait for confirmation)
  var url = req.params.url || req.body.url;
  var sessUser = req.session.user;
  
  //check rights of sessUser to dit
  return database.readDit({url: url})
    .then(function (_dit) {
      var joinable = rights.dit.join(_dit);
      if (joinable !== true) throw new Error('this dit cannot be joined. you can still write to admins and get invited');
      return database.createUserDit({username: sessUser.username}, {url: url}, 'join');
    })
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post(['/dit/:url/join/cancel', '/join-dit/cancel'], function (req, res, next) {
  //delete join relation if existent.
  var url = req.params.url || req.body.url;
  var sessUser = req.session.user;
  
  return database.deleteUserFromDit({username: sessUser.username}, {url: url}, 'join')
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post(['/dit/:url/accept-invitation', '/accept-invitation-to-dit'], function (req, res, next) {
  //if invited relation exists, change it to member
  var url = req.params.url || req.body.url;
  var sessUser = req.session.user;
  
  return database.updateUserDit({username: sessUser.username}, {url: url}, 'member', 'invited')
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post(['/dit/:url/not-accept-invitation, /not-accept-invitation-to-dit'], function (req, res, next) {
  //if invited relation exists, delete it.
  var url = req.params.url || req.body.url;
  var sessUser = req.session.user;
  
  return database.deleteUserFromDit({username: sessUser.username}, {url: url}, 'invited')
    .then(function (response) {
      console.log(response);
      //TODO response analysis
      return res.send({success: true});
    })
    .then(null, function (err) {
      next(err);
    });
});

router.post('/search-users', function (req, res, next) {
  var string = req.body.string;
  
  return database.searchUsers(string)
    .then(function (_users) {
      return res.send(_users);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.use(function(err, req, res, next) {
  res.send({error: err.message, status: err.status});
});

module.exports = router;
