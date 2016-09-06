'use strict';

var co = require('co');
var router = require('express').Router();
var generateUrl = require('./collection/functions').generateUrl;

var validate = require('../services/validation/validate');
var editRoute = require('./discussion/edit');

var postHideFollow = require('./partial/post-hide-follow');

const MAX_POST_LENGTH = 16384;

router.use(editRoute);
router.use(postHideFollow('discussion', {}));

router.post('/:id/:url',
  //check that user has rights (is logged in)
  function (req, res, next) {
    if(req.session.user.logged === true) {
      return next();
    }

    let e = new Error('Not Authorized');
    e.status = 403;
    return next(e);
  },
  function (req, res, next) {
    var sessUser = req.session.user;
    var id = req.params.id;
    var url = req.params.url;
    var db = req.app.get('database');
   
    return co(function * () {
      if(req.body.action === 'comment') {
        let text = req.body.comment;

        validate.comment.text(text);
        
        yield db.discussion.addComment(id, {text: text}, sessUser.username);
        sessUser.messages.push('comment successfuly added');
      }
      return next();
    
    }).catch(next);
  },
  function (err, req, res, next) {
    if(err.status === 400) {
      req.session.user.messages.push(err.message);
      return next();
    }
    return next(err);
  }
);

router.all(['/:id/:url', '/:id'], function (req, res, next) {
  let db = req.app.get('database');
  return co(function * () {
    var sessUser = req.session.user;
    var id = req.params.id;
    var url = req.params.url;

    req.ditup.discussion = req.ditup.discussion || {};

    let discussion = yield db.discussion.read(id);
    let expectedUrl = generateUrl(discussion.name);
    discussion.url = expectedUrl;
    
    if(url !== expectedUrl) {
      return res.redirect(`/discussion/${id}/${expectedUrl}`);
    }


    discussion.link = `${req.protocol}://${req.headers.host}${req.originalUrl}`; //this is a link for users for copying

    //copying params from previous routes
    for(var param in req.ditup.discussion) {
      discussion[param] = req.ditup.discussion[param];
    }

    //read comments of discussion
    let comments = yield db.discussion.readComments(id);
    discussion.comments = [];
    for(let comment of comments) {
      discussion.comments.push(comment);
    }

    //read tags of discussion
    let tags = yield db.discussion.tags(id)
    discussion.tags = [];
    for(let tag of tags) {
      discussion.tags.push(tag.name);
    }

    //find out whether user follows the discussion
    if(sessUser.logged === true) {
      discussion.following = yield db.discussion.followingUser(id, sessUser.username)
    }

    //count number of followers
    discussion.followerno = yield db.discussion.countFollowers(id);

    //sending the response
    if(sessUser.logged !== true) {
      sessUser.messages.push('<a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> to see more and contribute');
    }
    return res.render('discussion', {collection: discussion});
  })
    .catch(next);
});


module.exports = router;
