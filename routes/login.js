'use strict';

var router = require('express').Router();
var accountService = require('../services/account');
var accountModule = require('../modules/account');

let matchPassword = require('./login/matchPassword');

let co = require('co');

//checking whether the user is already logged in
router.all('*', function (req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    sessUser.messages.push(`you are logged in as <a href="/user/${sessUser.username}" >${sessUser.username}</a>. To log in as a different user you need to <a href="/logout">log out</a> first.`);
    return res.render('sysinfo');
  }
  return next();
});

//rendering login page
router.get('/', function (req, res, next) {
  return res.render('login');
});

router.post('/',
  //matching password
  matchPassword,
  //success management
  function (req, res, next) {
    let db = req.app.get('database');
    let sessUser = req.session.user;

    return co(function * (){
      //setting a session to logged
      sessUser.logged = true;
      sessUser.username = req.body.username;

      //updating last_login in database
      yield db.user.updateAccount({username: req.session.user.username}, {last_login: Date.now()});

      //some message
      req.session.messages.push(`login successful. you're logged in as <a href="/user/${sessUser.username}">${sessUser.username}</a>`);

      //redirecting
      var redir = req.query.redirect || '/';
      return res.redirect(redir);
    })
    .catch(next);
  },
  //catching the error and writing the error message
  function (err, req, res, next){
    let sessUser = req.session.user;
    if(err.status === 403 && err.message === 'login not successful') {
      sessUser.messages.push('login not successful');
      return res.render('login');
    }
    return next(err);
  }
);

module.exports = router;
