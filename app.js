'use strict';

require('./log-place');


var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var sessionSecret = require('./config/secret/session.json');

//var home = require('./routes/home');
//var signup = require('./routes/signup');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({secret: sessionSecret.secret, resave: true, saveUninitialized: true}));
app.use(express.static(path.join(__dirname, 'public')));

//setting session variables
app.use(function(req, res, next) {
  req.session.user = req.session.user || {logged: false, username: null};
  next();
});

//saving last visited page for redirects (after login)
app.use(function (req, res, next) {
  req.session.history = req.session.history || {current: '/', previous: '/'}
  req.session.keepHistory = req.session.history;
  var url = req.originalUrl;
  if(url !== req.session.history.current && url !== '/login' && url !== '/signup') {
    req.session.history.previous = req.session.history.current;
    req.session.history.current = url;
  }
  next();
});


//load routes to express
var routes = require('./routes.json');

for(var i=0, len=routes.length; i<len; i++) {
  var route = require("./routes/" + routes[i].router);
  console.log('loaded', routes[i].url);
  app.use(routes[i].url, route);
}

//app.use('/', home);
//app.use('/signup', signup);
//app.use('/login', login);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;

  //if page was not found, we don't want to reload to it.
  req.session.history = req.session.keepHistory;

  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.error(err, err.stack);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
