'use strict';

require('express');
var xss = require('xss');

var options = {
  whiteList: {}
};

module.exports = function (req, res, next) {
  try {
    for(let param in req.body) {
      req.body[param] = xss(req.body[param], options);
    }
    for(let param in req.query) {
      req.query[param] = xss(req.query[param], options);
    }
    return next();
  }
  catch(err) {return next(err);}
};
