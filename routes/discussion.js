'use strict';

var express = require('express');
var entities = require('entities');
var router = express.Router();
var validate = require('../services/validation');
var db = require('../services/data');

router.get('/:id/:url', function (req, res, next) {
  var sessUser = req.session.user;
  return res.render('discussion', {session: sessUser});
});

function generateUrl(string) {
  var wordArray = string.replace(/[^a-zA-Z0-9]+/g,' ').trim().toLowerCase().split(' ');
  var notIncluded = ['a', 'an', 'the'];
  var finalArray = [];

  for(let i = 0, len = wordArray.length; i<len; ++i) {
    if(notIncluded.indexOf(wordArray[i])===-1) {
      finalArray.push(wordArray[i]);
    }
  }

  return finalArray.join('-') || 'url';
}


module.exports = router;
