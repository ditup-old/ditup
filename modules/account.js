'use strict'

/** this module serves as wrapper to provide higher-level account functions
  * it can contain functions like: verifying new email, resetting passwords etc.
  *
  * @module modules/account
  */


var validate = require('../services/validation');
var database = require('../services/data');
var accountService = require('../services/account');
var accountConfig = require('../config/user/account.json');
var mailer = require('../services/mailer/mailer');

var independentAccount = require('./independentAccount');

var dependencies = {
  validate: validate,
  database: database,
  accountService: accountService,
  accountConfig: accountConfig,
  mailer: mailer
};

//independent as in dependencies are added
var exports = module.exports = independentAccount(dependencies);


