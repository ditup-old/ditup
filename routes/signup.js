'use strict';

let co = require('co');

var router = require('express').Router();

var accountModule = require('../modules/account');

//checking if user is not logged in
router.all('/', function(req, res, next) {
  var sessUser = req.session.user;
  if(sessUser.logged === true) {
    sessUser.messages.push(`you are logged in as <a href="/user/${sessUser.username}" >${sessUser.username}</a>. To sign up you need to <a href="/logout">log out</a> first.`);
    return res.render('sysinfo');
  }
  else {
    return next();
  }
});

router.get('/', function(req, res, next){
  return res.render('signup', {errors: {}, values: {}});
});

router.post('/', function (req, res, next) {
  var sessUser = req.session.user;
  var form = req.body;
  var formData = {
    username: form.username,
    email: form.email,
    password: form.password,
    password2: form.password2
  };

  return co(function * () {
    try {
      yield accountModule.createUser(formData);
    }
    catch(e) {
      if(e.message === 'invalid data') {
        sessUser.messages.push('there were some errors in processing signup request');
        return res.render('signup', { errors: e.errors, values: formData});
      }
      else throw(e);
    }

    let host = req.app.get('host');
    yield accountModule.initEmailVerification({username:formData.username, email: formData.email, host: host});

    //generate success message
    sessUser.username = formData.username;
    sessUser.logged = true;

    var message = `Welcome ${formData.username}. Your new account was created and verification email was sent to ${formData.email}. It should arrive soon. In the meantime why don't you fill up your profile?`;
    req.session.messages.push(message);
    return res.redirect(`/user/${formData.username}/edit?field=name`);
  })
    .catch(next);
});

module.exports = router;
