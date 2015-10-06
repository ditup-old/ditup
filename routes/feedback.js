'use strict';

var express = require('express');
var router = express.Router();
var validate = require('../services/validation');
var database = require('../services/data');


router.get('/', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('feedback', {session: sessUser, errors: {}, values: {from: {}}});
});

router.post('/', function (req, res, next) {
  /*{
    "from":"name",validate (empty string or validation)
    "email":"email", empty or validate email
    "subject":"subject",
    "context":"/feedback",
    "text":"feedback",
    "public":"public",
    "anonymous":"anonymous"
  }*/
  var sessUser = req.session.user;

  var errors = {};
  var values = {};

  //validation
  var valid = validate.feedback.all({
    from: sessUser.logged !== true ? {username: req.body.from.name, logged: false} : sessUser,
    email: sessUser.logged !== true ? req.body.email : null,
    subject: req.body.subject,
    context: req.body.context,
    text: req.body.text,
    public: req.body.public,
    anonymous: req.body.anonymous
  }, errors, values);

  //if(valid === true) return res.send(values);
  if(valid !== true ) return res.render('feedback', {errors: errors, values: values, session: sessUser});

  return database.feedback.create(values)
    .then(function (response) {
      return res.end('thank you for your feedback!');
    })
    .then(null, function (err) {
      return next(err);
    });

});


module.exports = router;
