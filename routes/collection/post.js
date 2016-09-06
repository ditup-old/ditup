'use strict';

let co = require('co');
let validate = require('../../services/validation/validate');

let output = {
  checkLogged: function (req, res, next) {
    if(req.session.user.logged === true) {
      return next();
    }

    let e = new Error('Not Authorized');
    e.status = 403;
    return next(e);
  },
  processPost: function (req, res, next) {
    var sessUser = req.session.user;
    var id = req.params.id;
    var url = req.params.url;
    var db = req.app.get('database');
    var collectionName = req.baseUrl.substr(1);
   
    return co(function * () {
      if(req.body.action === 'comment') {
        let text = req.body.comment;

        validate.comment.text(text);
        
        yield db[collectionName].addComment(id, {text: text}, sessUser.username);
        sessUser.messages.push('comment successfuly added');
      }
      return next();
    
    }).catch(next);
  },
  processErrors: function (err, req, res, next) {
    if(err.status === 400) {
      req.session.user.messages.push(err.message);
      return next();
    }
    return next(err);
  }
};

module.exports = output;
