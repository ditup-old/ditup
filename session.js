'use strict';

var session = require('express-session');
var sessionSecret = require('./config/secret/session.json');
module.exports = session({secret: sessionSecret.secret, resave: true, saveUninitialized: true});
