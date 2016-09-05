'use strict';

let co = require('co');
let accountService = require('../../services/account');

module.exports = function (req, res, next) {
  let db = req.app.get('database');
  
  var username = req.body.username;
  var password = req.body.password;

  return co(function * () {
    //this is a general error if login not successful
    let errNoSuccess = new Error('login not successful');
    errNoSuccess.status = 403;
    
    //reading user and catching her non-existence
    try {
      var user = yield db.user.read({username: username});
    }
    catch(err) {
      if(err.status === 404) throw errNoSuccess;
      throw err;
    }

    let hash = user.login.hash;
    let salt = user.login.salt;
    let iterations = user.login.iterations;
    
    //hash the provided password
    let hash2 = yield accountService.hashPassword(password, salt, iterations);

    //compare the hashes
    let isPasswordCorrect = accountService.compareHashes(hash, hash2);
    
    //success: continue routing
    if(isPasswordCorrect) return next();

    throw errNoSuccess;
  }).catch(next);
};
