'use strict';

let router = require('express').Router();
var co = require('co');

var validate = require('../../services/validation/validate');
var generateUrl = require('../collection/functions').generateUrl;

module.exports = router;

// authorization
router.all('/new', function (req, res, next) {
  if(req.session.user.logged === true) {
    return next();
  }
  let e = new Error('Not Authorized');
  e.status = 403;
  return next(e);
});

router.post('/new', function (req, res, next) {
  let collectionName = req.baseUrl.slice(1,-1);
  var name = req.body.name;
  var description = req.body.description;
  var joining = req.body.joining;
  var joinInfo = req.body['join-info'];
  var sessUser = req.session.user;

  return co(function * () {
    validate.collection.name(name);
    validate.collection.description(description);
    if(collectionName === 'project') {
      validate.project.joining(joining);
      validate.project.joinInfo(joinInfo);
    }

    let db = req.app.get('database');

    let collectionData = {
      name: name,
      description: description,
      creator: sessUser.username
    }
    if(collectionName === 'project') {
      collectionData.join_info = joinInfo;
      collectionData.join = joining === 'yes' ? true : false;
    }
    let collection = yield db[collectionName].create(collectionData);
    //make creator a member
    if(collectionName === 'project') {
      yield db.project.addMember(collection.id, sessUser.username, 'member');
    }

    var url = generateUrl(name);
    req.session.messages.push(`the new ${collectionName} was successfully created. add some tags!`);
    return res.redirect(`/${collectionName}/${collection.id}/${url}/edit?field=tags`);
  })
  .catch(function (e) {
    if(e.status === 400) {
      if(e.detail && e.detail.field) {
        if(e.detail.field === 'name') {
          switch(e.detail.rule) {
            case 'minLength':
            case 'regex':
              sessUser.messages.push('the name is too short (min 1 nonempty character)');
              break;
            case 'maxLength':
              sessUser.messages.push(`the name is too long (max ${e.detail.ruleValue} characters)`);
              break;
            default:
              sessUser.messages.push(e.message);
          }
        }
        else if(e.detail.field === 'description') {
          switch(e.detail.rule) {
            case 'minLength':
            case 'regex':
              sessUser.messages.push('the description is too short (min 1 nonempty character)');
              break;
            case 'maxLength':
              sessUser.messages.push(`the description is too long (max ${e.detail.ruleValue} characters)`);
              break;
            default:
              sessUser.messages.push(e.messsage);
          }
        }
        else if(e.detail.field === 'joining') {
          switch(e.detail.rule) {
            case 'list':
              sessUser.messages.push(`one of the provided options must be chosen`);
              break;
            default:
              sessUser.messages.push(e.messsage);
          }
        }
        else if(e.detail.field === 'joinInfo') {
          switch(e.detail.rule) {
            case 'maxLength':
              sessUser.messages.push(`the info for joiners is too long (max ${e.detail.ruleValue} characters)`);
              break;
            default:
              sessUser.messages.push(e.messsage);
          }
        }
        res.locals.values = {
          name: name,
          description: description,
          joining: joining,
          joinInfo: joinInfo
        };
        return next();
      }
    }
    return next(e);
  })
  .catch(next);
      
});

router.all('/new', function (req, res, next) {
  res.locals.collectionName = req.baseUrl.slice(1,-1);
  return res.render(`collections-new`);
});
