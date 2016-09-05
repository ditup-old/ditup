'use strict';

var express = require('express');
var router = express.Router();
var fs = require('fs');
var co = require('co');

var marked = require('marked');
marked.setOptions({});

router.get('/', function(req, res, next) {
  let sessUser = req.session.user;

  function readFile(path) {
    return new Promise(function (resolve, reject) {
      fs.readFile(path, 'utf8', function(err, data) {
        if(err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  return co(function *() {
    let content = yield readFile('services/data/about.ejs');
    /*
    let md = yield readFile('services/data/about.md');
    let content = marked(md);
    */

    return res.render('about', {session: sessUser, content: content});
  })
  .catch(function (err) {
    next(err);
  });
});

module.exports = router;
