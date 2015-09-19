'use strict';

//this service strictly validates form of the fields. no database access.

var signup = {};

signup.username = function (username, errors) {
  var errors = errors || [];
  //username regex
  var usernameRegex = /^([a-z0-9_\-\.]{2,32})$/;

  if(usernameRegex.test(username) === true) return true;

  errors.push('username must be 2-32 characters long and contain only a-z, 0-9, _, -');
  return false;
};

signup.email = function (email, errors) {
  var errors = errors || [];
  //username regex
  var regex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

  if(regex.test(email) === true) return true;

  errors.push('invalid email');
  return false;
};

signup.name = function (name, errors) {
  var errors = errors || [];
  //name, surname max 128 characters long
  if(name.length <= 128) return true;

  errors.push('name can be max 128 characters long');
  return false;
};

signup.surname = function (surname, errors) {
  var errors = errors || [];
  if(surname.length <= 128) return true;

  errors.push('surname can be max 128 characters long');
  return false;
};

signup.password = function (password, errors) {
  var errors = errors || [];
  /*
  //password regex
  var passwordRegex = /(?=^.{8,128}$)(?=.*[a-zA-Z0-9])(?=.*[^A-Za-z0-9]).*$/
  if(passwordRegex.test(password) === true) return true;

  errors.push('password must be at least 8 characters long and contain [a-zA-Z0-9] and some special character');
  return false;
  */
  if(password.length >=6) return true;
  
  errors.push('password must be at least 6 characters long');
  return false;
};

signup.passwordMatch = function (password, password2, errors) {
  var errors = errors || [];
  if(password === password2) return true;

  errors.push('passwords don\'t match');
  return false;
};

signup.all = function (form, errors) {
  var errors = errors || {}
  var valid = true;

  //username
  errors.username = errors.username || [];

  valid = signup.username(form.username, errors.username) && valid;
  //email
  errors.email = errors.email || [];
  valid = signup.email(form.email, errors.email) && valid;
  //name
//  errors.name = errors.name || [];
  //valid = valid && signup.name(form.name, errors.name);
  //surname
//  errors.surname = errors.surname || [];
  //valid = valid && signup.surname(form.surname, errors.surname);
  //password
  errors.password = errors.password || [];
  valid = signup.password(form.password, errors.password) && valid;
  //passwordMatch
  errors.password2 = errors.password2 || [];
  valid = signup.passwordMatch(form.password, form.password2, errors.password2) && valid;

  return valid;
};

module.exports = {
  signup : signup
};
