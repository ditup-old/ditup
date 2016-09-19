'use strict';

module.exports = function (session) {

  //require('./log-place');

  var express = require('express');
  var path = require('path');
  var favicon = require('serve-favicon');
  var logger = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser = require('body-parser');
  var sanitizer = require('./services/sanitizer');

  var database = require('./services/data');

  //add some method to String
  String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  }

  //var home = require('./routes/home');
  //var signup = require('./routes/signup');

  var app = express();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  //setting database globally
  app.set('database', database);

  //setting host globaly
  let host = require('./config/host')
  app.set('host', `${host.protocol}://${host.hostname}`);

  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  //
  //app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use(session);
  app.use(sanitizer);
  app.use(express.static(path.join(__dirname, 'public')));

  //setting session variables
  app.use(function(req, res, next) {
    req.session.user = req.session.user || {logged: false, username: null};
    next();
  });
  
  //initialize object for storing variables through middlewares
  app.use(function(req,res,next){
    req.ditup = {};
    next();
  });
  
  /*
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
  */
  
  //update user active to now (when was the user last active? when active, update.)
  app.use(require('./routes/active-user'));

  app.use(function (req, res, next) {
    //push message into req.session.user.messages to show it in the nearest view
    //push message into req.session.messages to show it in next view (i.e. useful for redirects)
    //req.app = req.app || {};
    //req.app.messages = req.session.messages;
    req.session.messages = req.session.messages || [];
    req.session.user.messages = req.session.messages;
    req.session.messages = [];
    next();
  });

  app.use(require('./routes/count-messages'));
  app.use(require('./routes/count-notifications'));
  
  //a parameter url provided to ejs views
  app.use(function(req, res, next) {
    res.locals.url = req.originalUrl;
    next();
  });

  app.use(function(req, res, next) {
    res.locals.session = req.session.user;
    next();
  });

  //load routes to express
  var routes = require('./routes.json');

  for(let route of routes) {
    let router = require('./routes/' + route.router);
    //console.log('loaded', route.url);
    app.use(route.url, router);
  }
  
//  let various = require('./routes/various');
//  app.use(various);

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
  if (app.get('env') === 'development' || app.get('env') === 'test') {
    app.use(function(err, req, res, next) {
      err.status = err.status || err.code || 500;
      res.status(err.status);
      console.error(err.status, err);
      return res.format({
        'text/html': function () {
          let preparedErrors = [400, 403, 404];
          if(preparedErrors.indexOf(err.status)>-1){
            if(err.status === 400) res.locals.message = err.message;
            return res.render(`./errors/${err.status}`);
          }
          if(err.status === 500) {
            res.locals.message = err.message;
            res.locals.stack = err.stack;
            return res.render(`./errors/500`);
          }
          return res.render('error', {
            message: err.message,
            error: err
          });
        },
        'application/json': function () {
          err.status = err.status || 500;
          res.status(err.status).send({error: err.message});
        }
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.format({
      'text/html': function () {
        res.render('error', {message: err.message, error: {}});
      },
      'application/json': function () {
        err.status = err.status || 500;
        res.status(err.status).send({error: err.message});
      }
    });
  });


  return app;
};
