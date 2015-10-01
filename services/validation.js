'use strict';

/**
 * Validation module.
 * @module validation
 * @namespace validation
 */

//this service strictly validates form of the fields. no database access.
/**
 * Object user containing methods
 * @memberof validation
 * @type {Object}
 * @property {method} username
 */
var user = exports.user = {};
var dit = exports.dit = {};
var tag = exports.tag = {};


/**
 * Validates username against regex && length.
 * @alias user.username
 * @memberof! validation#
 * @method user.username
 * @param {string} username
 * @param {Array.<string>} [errors=[]] Array to push string errors to.
 * @param {Object[]} data
 * @param {string} data.name
 * @param {string} data.email
 * @param {Array.<{name:string, email:string}>} data3
 * @returns {boolean}
 */
exports.user.username = function (username, errors) {
  var errors = errors || [];
  //username regex
  var usernameRegex = /^(?=.{2,32}$)[a-z0-9]+([_\-\.][a-z0-9]+)*$/;

  if(usernameRegex.test(username) === true) return true;

  errors.push('username must be 2-32 characters long and contain only a-z, 0-9, _, -, .');
  return false;
};

/**
 * Validates email against regex
 * @alias user.email
 * @memberof! validation#
 * @method user.email
 * @param {string} email
 * @param {Array.<string>} [errors=[]] Array to push string errors to.
 * @returns {boolean}
 */
exports.user.email = function (email, errors) {
  var errors = errors || [];
  //username regex
  var regex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

  if(regex.test(email) === true) return true;

  errors.push('invalid email');
  return false;
};

/**
 * Validates name against length
 * @alias user.name
 * @memberof! validation#
 * @method user.name
 * @param {string} name
 * @param {Array.<string>} [errors=[]] Array to push string errors to.
 * @returns {boolean}
 */
exports.user.name = function (name, errors, values) {
  var errors = errors || [];
  var values = values || {};
  //name, surname max 128 characters long
  values.name = name;
  if(name.length <= 128) return true;

  errors.push('name can be max 128 characters long');
  return false;
};

/**
 * Validates surname against regex && length
 * @param {string} surname
 * @param {Array.<string>} [errors=[]] Array to push string errors to.
 * @returns {boolean}
 */
exports.user.surname = function (surname, errors, values) {
  var errors = errors || [];
  var values = values || {};
  values.surname = surname;
  if(surname.length <= 128) return true;

  errors.push('surname can be max 128 characters long');
  return false;
};

/**
 * Validates password against length
 * @param {string} password
 * @param {Array.<string>} [errors=[]] Array to push string errors to.
 * @returns {boolean}
 */
exports.user.password = function (password, errors) {
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

/**
 * Check whether two passwords match.
 * @param {Array.<string>} passwords Two strings provided.
 * @param {Array.<string>} [errors=[]] Array which will be filled with errors.
 * @param {Object} [values={}] Object which will be given validated value.
 * @returns {boolean} passwords[0] === passwords [1]
 */
user.passwordMatch = function (passwords, errors, values) {
  var values = values || {};
  var errors = errors || [];
  if(passwords[0] === passwords[1]) return true;

  errors.push('passwords don\'t match');
  return false;
};

/**
 * Validate signup form data (username, email, password, passwords matching).
 * @param {Object} data
 * @param {string} data.username
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} data.password2
 * @param {Object} [errors={}] Object which will be filled with arrays of errors for each field.
 * @param {Object} [values={}] Object which will be given validated value.
 * @returns {boolean}
 */
user.signup = function (data, errors, values) {
  var errors = errors || {};
  var values = values || {};
  errors.password2 = errors.password2 || [];
  var singles = valiterate(['username', 'email', 'password']).call(this, data, errors, values);

  var password = this.passwordMatch.call(this, [data.password, data.password2], errors.password2, values);

  return singles && password;
};


/*
function (form, errors) {
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
*/

/**
 * Check whether birthday matches required regex.
 * @param {string} birthday
 * @param {Array.<string>} [errors=[]] Array which will be filled with errors.
 * @param {Object} [values={}] Object which will be given validated birthday:value.
 * @returns {boolean}
 */
user.birthday = function (birthday, errors, values) {
  var errors = errors || [];
  var values = values || {};
  values.birthday = values.birthday === '' ? null : birthday;
  //validate birthday

  var birthdayRegex = /^(19|20)[0-9]{2}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
  if (!birthdayRegex.test(birthday) && birthday !== '') {
    errors.push('birthday is in wrong format. please use yyyy-mm-dd');
    return false;
  }

  return true;
};

/**
 * Check whether gender is contained in Array of possible values: ['unspecified', 'male', 'female', 'other'].
 * @param {string} gender
 * @param {Array.<string>} [errors=[]] Array which will be filled with errors.
 * @param {Object} [values={}] Object which will be given validated gender:value.
 * @returns {boolean}
 */
user.gender = function (gender, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  var valid = true;
  //validate gender [unspecified, male, female, other]
  var genderArray = ['unspecified', 'male', 'female', 'other'];
  var genderIndex = genderArray.indexOf(gender);
  if(!(genderIndex > -1)) {
    valid = false;
    errors.push('please select gender from the list provided');
  }
  values.gender = (genderIndex > 0) ? genderArray[genderIndex] : null;

  return valid;
};

/**
 * Check whether about length does not exceed 16384 characters
 * @param {string} about
 * @param {Array.<string>} [errors=[]] Array which will be filled with errors.
 * @param {Object} [values={}] Object which will be given validated about:value.
 * @returns {boolean}
 */
user.about = dit.about = function (about, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  values.about = about;
  //validate about (0 - 16384 characters)
  if (about.length > 16384) {
    errors.push('description is too long (max 16384 characters)');
    return false;
  }
  return true;
};

/**
 * @function
 * Validate user profile data (name, surname, gender, birthday, about).
 * @param {Object} data
 * @param {string} data.name
 * @param {string} data.surname
 * @param {string} data.gender
 * @param {string} data.birthday
 * @param {string} data.about
 * @param {Object} [errors={}] Object which will be filled with arrays of errors for each field.
 * @param {Object} [values={}] Object which will be given validated value.
 * @returns {boolean}
 */
user.profile = valiterate(['name', 'surname', 'gender', 'birthday', 'about']);

/**
 * Check whether view (settings) is contained in Array of possible values: ['all', 'me'].
 * @function user/view
 * 
 * @param {string} view
 * @param {Array.<string>} [errors=[]] Array which will be filled with errors.
 * @param {Object} [values={}] Object which will be given validated view:value.
 * @returns {boolean}
 */
user.view = function (view, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  var valid = true;
  //validate view settings
  var viewSettingsArray = ['all', 'me'];

  var viewIndex = viewSettingsArray.indexOf(view);
  if(!(viewIndex > -1)) {
    valid = false;
    errors.push('please select option from the list provided');
  }
  values.view = (viewIndex >= 0) ? viewSettingsArray[viewIndex] : null;

  return valid;
};

/**
 * Validate user settings data (view).
 * @function user/settings
 * @param {Object} data
 * @param {string} data.view
 * @param {Object} [errors={}] Object which will be filled with arrays of errors for each field.
 * @param {Object} [values={}] Object which will be given validated value.
 * @returns {boolean}
 */
exports.user.settings = valiterate(['view']);

dit.url = function (url, errors, values) {
  var errors = errors || [];
  var values = values || {};
  values.url = url;

  //validate url 
  var valid = true;
  var regex = /^[a-z0-9]+(\-[a-z0-9]+)*$/;

  if (!regex.test(url)) {
    errors.push('examples: good: "user", "user-1-23", bad: "12user", "-a--a-"');
    valid = false;
  }
  var len = url.length;
  if(len<2 || len> 128) {
    errors.push('url needs to be 2-128 characters long');
    valid = false;
  }

  return valid;
};

dit.dittype = function (dittype, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  var valid = true;
  //validate dittype ['unspecified', 'idea', 'project', 'challenge', 'interest']
  var dittypeArray = ['unspecified', 'idea', 'project', 'challenge', 'interest'];

  var dittypeIndex = dittypeArray.indexOf(dittype);
  if(!(dittypeIndex > -1)) {
    valid = false;
    errors.push('please select type from the list provided');
  }
  values.dittype = (dittypeIndex > 0) ? dittypeArray[dittypeIndex] : null;

  return valid;
};

dit.name = function (name, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  values.name = name;
  //validate name (0 - 16384 characters)
  if (name.length > 128) {
    errors.push('name is too long (max 128 characters)');
    return false;
  }
  return true;
};

dit.summary = function (summary, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  values.summary = summary;
  //validate summary (140 characters)
  if (summary.length > 140) {
    errors.push('summary is too long (max 140 characters)');
    return false;
  }
  return true;
};

//here we validate dit view settings (who has rights to view dit?)
dit.view = function (view, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  var valid = true;
  //validate view settings
  var viewSettingsArray = ['all', 'members', 'admins'];

  var viewIndex = viewSettingsArray.indexOf(view);
  if(!(viewIndex > -1)) {
    valid = false;
    errors.push('please select option from the list provided');
  }
  values.view = (viewIndex >= 0) ? viewSettingsArray[viewIndex] : null;

  return valid;
};

//here we validate user edit settings (who has right to edit dit?) (TODO it's not clear what is dit editing)
dit.edit = function (edit, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  var valid = true;
  //validate view settings
  var editSettingsArray = ['all', 'members', 'admins'];

  var editIndex = editSettingsArray.indexOf(edit);
  if(!(editIndex > -1)) {
    valid = false;
    errors.push('please select option from the list provided');
  }
  values.edit = (editIndex >= 0) ? editSettingsArray[editIndex] : null;

  return valid;
};

dit.create = valiterate(['url', 'dittype', 'name', 'summary']);

dit.profile = valiterate(['dittype', 'name', 'summary', 'about']);

dit.settings = valiterate(['view', 'edit']);

tag.name = function (name, errors, values) {
  var errors = errors || [];
  var values = values || {};
  values.name = name;

  //validate url 
  var valid = true;
  var regex = /^[a-z0-9]+(\-[a-z0-9]+)*$/;

  if (!regex.test(name)) {
    errors.push('examples: good: "tag", "some-tag-1-23", "12tag"; bad: "-tag--a-"');
    valid = false;
  }
  var len = name.length;
  if(len < 2 || len > 64) {
    errors.push('tag name needs to be 2-64 characters long');
    valid = false;
  }

  return valid;
};

tag.description = function (description, errors, values) {
  var errors = errors || [];
  var values = values || {};
  
  values.description = description;
  //validate about (0 - 16384 characters)
  if (description.length > 2048) {
    errors.push('description is too long (max 2048 characters)');
    return false;
  }
  return true;
};

tag.edit = valiterate(['description']);

tag.create = valiterate(['name', 'description']);

//function which iterates through specific fields for validation
function valiterate(fields) {
  return function (data, errors, values) {
    var errors = errors || {};
    var values = values || {};
    //url, dittype, name, summary

    var valid = true;

    for(let field of fields){
      errors[field] = errors[field] || [];
      valid = this[field](data[field], errors[field], values) && valid;
    }
    
    return valid;
  };
}
