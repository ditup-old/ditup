'use strict';

module.exports = function independentAccount(dependencies) {
  var validate = dependencies.validate;
  var database = dependencies.database;
  var accountService = dependencies.accountService;
  var accountConfig = dependencies.accountConfig;
  var mailer = dependencies.mailer;

  const ITERATIONS = accountConfig.password.iterations;

  var badInput = new Error('incorrect function input');

  var ret = {};



  /**
   * This function will:
   *  create code, salt and hash for email verification
   *  save new email, salt and hash to database and set verified to false
   *  send verification email with url https://ditup.org/account/verify-email/:username/:code
   *
   * @param {Object} data
   * @param {string} data.username
   * @param {string} data.email
   * @returns {Promise}
   */
  ret.initEmailVerification = function (data) {
    var username = data.username;
    var email = data.email;
    //create verification code, salt & hash

    var code;
    var salt;
    var hash;

    return accountService.generateHexCode(16)
      .then(function (_code){
        code = _code;
        return accountService.generateSalt();
      })
      .then(function (_salt) {
        salt = _salt;
        return accountService.hashPassword(code, salt, ITERATIONS);
      })
      .then(function (_hash) {
        hash = _hash;

        var data = {
          create_date: Date.now(),
          hash: hash,
          salt: salt,
          iterations: ITERATIONS
        };
        var user = {
          username: username,
          email: email
        };
        return database.updateUserEmailVerifyCode(user, data);
      })
      .then(function sendEmail() {
        var mailerData = {
          username: username,
          email: email,
          url: 'https://ditup.org/account/verify-email/'+username+'/'+code
        };
        return mailer.send.verifyEmail(mailerData);
      });
  };

  /**
   * This function will
   *  check if email is not yet verified
   *  check if code is not expired (not older than 2 hours)
   *  check if code is correct
   *  and if all above is true, will verify email in database (verified = true, hex & salt & iterations = null, set verify_date)
   *
   * @param {Object} data
   * @param {string} data.username
   * @param {string} data.code
   * @returns {Promise}
   */
  ret.verifyEmail = function (data) {
    var username = data.username;
    var code = data.code;

    var hash, salt, iterations, createDate;
    
    //first read user from database (async)
    return database.readUser({username: username})
      .then(function (user) {
        //if user is already verified, don't continue
        if(user.account.email.verified === true) throw new Error('user ' + username + ' has already verified email');

        hash = user.account.email.hash;
        salt = user.account.email.salt;
        iterations = user.account.email.iterations;
        createDate = user.account.email.create_date;
        
        //check that create_date of code is not older than 2 hours
        var isExpired = Date.now() - createDate > 2*3600*1000;
        if(isExpired) throw new Error('code is expired');

        //hash verification code (async)
        return accountService.hashPassword(code, salt, iterations);
      })
      .then(function (hash2) {
        //compare hash codes
        var areHashesEqual = accountService.compareHashes(hash, hash2);
        if(areHashesEqual !== true) throw new Error('code is wrong');
        //
        return database.updateUserEmailVerified({username: username}, {verified: true, verifyDate: Date.now()});
      });
  };

  /**
   * This function will:
   *  create code, salt and hash for resetting password
   *  save salt, hash and creation time to database and set verified to false
   *  send reset-password email with url https://ditup.org/account/reset-password/:username/:code
   * @param {Object} user
   * @param {string} user.username
   * @param {string} user.email
   * @returns {Promise}
   */
  ret.initResetPassword = function (user) {
    var username = user.username;
    var email = user.email;
    //create verification code, salt & hash

    var code;
    var salt;
    var hash;

    return Promise.all([accountService.generateHexCode(16), accountService.generateSalt()])
      .then(function (_ret){
        code = _ret[0];
        salt = _ret[1];
        return accountService.hashPassword(code, salt, ITERATIONS);
      })
      .then(function (_hash) {
        hash = _hash;

        var data = {
          create_date: Date.now(),
          hash: hash,
          salt: salt,
          iterations: ITERATIONS
        };
        var user = {
          username: username,
        };
        return database.updateUserResetPasswordCode(user, data);
      })
      .then(function sendEmail() {
        var mailerData = {
          username: username,
          email: email,
          url: 'https://ditup.org/account/reset-password/'+username+'/'+code
        };
        return mailer.send.resetPassword(mailerData);
      });
  };

  ret.isResetPasswordCodeValid = function (data) {
    if(data.hasOwnProperty('username') !== true || data.hasOwnProperty('code') !== true) throw badInput;
    //{username: username, code: code}
    var username = data.username;
    var code = data.code;

    var hash, salt, iterations, createDate;
    
    //first read user from database (async)
    return database.readUser({username: username})
      .then(function (user) {

        //if reset_password is not there, throw not initialised error
        let notThere = !user.account.hasOwnProperty('reset_password') ||
          !user.account.reset_password ||
          !user.account.reset_password.hash ||
          !user.account.reset_password.salt ||
          !user.account.reset_password.iterations ||
          !user.account.reset_password.create_date;

        if(notThere) throw new Error('reset is not initialised');

        hash = user.account.reset_password.hash;
        salt = user.account.reset_password.salt;
        iterations = user.account.reset_password.iterations;
        createDate = user.account.reset_password.create_date;
        
        //check that create_date of code is not older than 30 minutes
        var isExpired = Date.now() - createDate > 1800*1000;
        if(isExpired) throw new Error('code is expired');

        //hash verification code (async)
        return accountService.hashPassword(code, salt, iterations);
      })
      .then(function (hash2) {
        //compare hash codes
        var areHashesEqual = accountService.compareHashes(hash, hash2);
        if(areHashesEqual !== true) throw new Error('code is wrong');
        //
        return true;
      });
  };

  ret.updatePassword = function (data) {
    if(!data.hasOwnProperty('username') || !data.hasOwnProperty('password')) throw badInput;
    var username = data.username;
    var password = data.password;
    var salt;
    var hash;

    //generate salt for password hash
    return accountService.generateSalt()
      .then(function (_salt) {
        salt = _salt;

        //generate hash
        return accountService.hashPassword(password, salt, ITERATIONS);
      })
      .then(function (_hash) {
        hash = _hash;

        //this user should be saved to database
        var login = {
          salt: salt,
          hash: hash,
          iterations: ITERATIONS
        };

        var user = {username: username};
        
        //save new user to database
        return database.updateUserPassword(user, login);
      });
  };

  /**
   * @param {Object} data
   * @param {string} data.username
   * @param {string} data.password
   * @returns {Promise<boolean>}
   */
  ret.matchPassword = function (data, returnUserData) {
    if(!data.hasOwnProperty('username') || !data.hasOwnProperty('password')) throw badInput;
    returnUserData = returnUserData || {};
    var username = data.username;
    var password = data.password;
    var hash, salt, iterations;

    return database.readUser({username: username})
      .then(function (user) {
        if(!user) throw new Error('user not exist');
        returnUserData.name = user.profile.name;
        returnUserData.surname = user.profile.surname;
        returnUserData.username = user.username;
        returnUserData.email = user.email;
        hash = user.login.hash;
        salt = user.login.salt;
        iterations = user.login.iterations;

        //hash the provided password
        return accountService.hashPassword(password, salt, iterations);
      })
      .then(function (hash2) {
        //compare password hashes
        var isPasswordCorrect = accountService.compareHashes(hash, hash2);
        if(isPasswordCorrect === true) {
          return true;
        }

        return false;
      })
      .then(null, function (err) {
        if(err.message === 'user not exist') {return false;}
      });
  };

  /**
   * @params {Object} user
   * @params {string} user.username
   * @returns {Promise}
   */
  ret.deleteUser = function (user) {
    //TODO more fancy and complicated deleting of user content, ideally in transaction

    return database.deleteUser(user);
  };

  ret.createUser = function (user) {
    //user: username, password, password2, email
    //this function creates user including validation and password hashing and saving to database
    //first let's validate data from the form

    function validateUser(user) {
      var errors = {};
      var valid = validate.user.signup(user, errors);

      //now let's check if username and email are unique
      return database.usernameExists(user.username)
        .then(function usernameExists(exists) {
          valid = valid && !exists;
          if(exists === true) errors.username.push('username must be unique');
          return database.emailExists(user.email);
        })
        .then(function emailExists(exists) {
          valid = valid && !exists;
          if(exists === true) errors.email.push('email must be unique');

          if(valid === true) {
            return;
          }
          else {
            var err = new Error('invalid data');
            err.errors = errors;
            throw err;
          }
        });
    }

  //this is very much MODEL function TODO move to some kind of model
    function constructUser(user) {
      var salt;
      var hashed;

      //generate salt for password hash
      return accountService.generateSalt()
        .then(function (_salt) {
          salt = _salt;

          //generate hashed password
          return accountService.hashPassword(user.password, salt, ITERATIONS);
        })
        .then(function (_hashed) {
          hashed = _hashed;

          //this user should be saved to database
          var newUser = {
            username: user.username,
            email: user.email,
            profile: {
              name: '',
              surname: '',
              birthday: '',
              gender: '',
              about: ''
            },
            account:{
              join_date: Date.now(),
              email: {
                verified: false
              },
              active_account: true,
              last_login: Date.now(),
              last_message_visit: null
            },
            login: {
              salt: salt,
              hash: hashed,
              iterations: ITERATIONS
            }
          };

          return newUser;
        });
    
    }

    return validateUser({username: user.username, password: user.password, password2: user.password2, email: user.email})
      .then(function () {
        return constructUser({username: user.username, password: user.password, email: user.email});
      })
      .then(database.createUser);
  };
  
  return ret;
};

