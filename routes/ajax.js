'use strict';

var Q = require('q');
var express = require('express');
var router = express.Router();
var rights = require('../services/rights');
var database = require('../services/data');
var validate = require('../services/validation');

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

router.post('/search-tags', function (req, res, next) {
  var string = req.body.string;
  
  return database.searchTags(string)
    .then(function (_tags) {
      return res.send(_tags);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.post('/read-tags-of-user', function (req, res, next) {
  var sessUser = req.session.user;
  var username = req.body.username || sessUser.username;
  
  var user; // we'll store user data here.

  //read user
  //database.readUser({username: username})
  Q.resolve({username: username})
    .then(function (_user) {
      user = _user;
      return rights.user.view(sessUser, _user);
    })
    .then(function (canView) {
      if(canView !== true) throw new Error('you don\'t have rights to see user');
      return database.readTagsOfUser({username: username})
    })
    .then(function (_tags) {
      return res.send(_tags);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.post('/read-tags-of-dit', function (req, res, next) {
  var sessUser = req.session.user;
  var url = req.body.url;
  
  var dit; // we'll store dit data here.

  //read dit
  return database.readDit({url: url})
    .then(function (_dit) {
      dit = _dit;
      if (dit === null) {
        var err = new Error('dit doesn\'t exist');
        err.status = 404;
        throw err;
      }
      //read dit's membership to me
      return database.readMemberOf({username: sessUser.username}, {url: url});
    })
    .then(function (_edge) {
      var relation = _edge === null ? null : _edge.relation;
      //see if sessUser can see dit
      return rights.dit.view(sessUser, dit, relation);
    })
    .then(function (canView) {
      if(canView !== true) throw new Error('you don\'t have rights to see dit');
      return database.readTagsOfDit({url: url});
    })
    .then(function (_tags) {
      return res.send(_tags);
    })
    .then(null, function (err) {
      return next(err);
    });
});


//adds tag to current user
router.post('/add-tag', function (req, res, next) {
  var sessUser = req.session.user;
  var name = req.body.name;

  if(validate.tag.name(name) !== true) throw new Error('POST data (name) invalid');
  
  return database.addTagToUser({name: name}, {username: sessUser.username})
    .then(function (response) {
      return res.send(response);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.post('/remove-tag', function (req, res, next) {
  var sessUser = req.session.user;
  var name = req.body.name;

  if(validate.tag.name(name) !== true) throw new Error('name is invalid');
  
  return database.deleteTagFromUser({name: name}, {username: sessUser.username})
    .then(function (response) {
      return res.send(response);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.post('/add-tag-to-dit', function (req, res, next) {
  var sessUser = req.session.user;
  var url = req.body.url;
  var name = req.body.name;

  if(validate.dit.url(url) !== true) throw new Error('dit url not valid');
  if(validate.tag.name(name) !== true) throw new Error('tag name not valid');
  
  var dit; // we'll store dit data here.

  //read dit
  return database.readDit({url: url})
    .then(function (_dit) {
      dit = _dit;
      if (dit === null) {
        var err = new Error('dit doesn\'t exist');
        throw err;
      }
      //read dit's membership to me
      return database.readMemberOf({username: sessUser.username}, {url: url});
    })
    .then(function (_edge) {
      var relation = _edge === null ? null : _edge.relation;
      //see if sessUser can edit dit
      return rights.dit.edit(sessUser, dit, relation);
    })
    .then(function (canEdit) {
      if(canEdit !== true) throw new Error('you don\'t have rights to add tags');
      return database.addTagToDit({name: name}, {url: url});
    })
    .then(function (response) {
      return res.send(response);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.post('/remove-tag-from-dit', function (req, res, next) {
  var sessUser = req.session.user;
  var url = req.body.url;
  var name = req.body.name;

  if(validate.dit.url(url) !== true) throw new Error('dit url not valid');
  if(validate.tag.name(name) !== true) throw new Error('tag name not valid');
  
  var dit; // we'll store dit data here.

  //read dit
  return database.readDit({url: url})
    .then(function (_dit) {
      dit = _dit;
      if (dit === null) {
        var err = new Error('dit doesn\'t exist');
        throw err;
      }
      //read dit's membership to me
      return database.readMemberOf({username: sessUser.username}, {url: url});
    })
    .then(function (_edge) {
      var relation = _edge === null ? null : _edge.relation;
      //see if sessUser can edit dit
      return rights.dit.edit(sessUser, dit, relation);
    })
    .then(function (canEdit) {
      if(canEdit !== true) throw new Error('you don\'t have rights to remove tags');
      return database.deleteTagFromDit({name: name}, {url: url});
    })
    .then(function (response) {
      return res.send(response);
    })
    .then(null, function (err) {
      return next(err);
    });
});

router.use(function(err, req, res, next) {
  err.status = err.status || 200;
  res.status(err.status).send({error: err.message});
});

module.exports = router;
