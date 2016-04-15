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
var feedback = exports.feedback = {};

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
exports.user.email = function (email, errors, values) {
  var errors = errors || [];
  var values = values || {};
  //username regex
  var regex = /^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;

  values.email = email.substring(0, 1024);

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
  if(password.length >=6 && password.length <= 512) return true;
  
  errors.push('password must be 6 - 512 characters long');
  return false;
};

/**
 * Check whether two passwords match.
 * @param {Array.<string>} passwords Array of two strings
 * @param {Array.<string>} [errors=[]] Array which will be filled with errors.
 * @param {Object} [values={}] Object which will be given validated value.
 * @returns {boolean} passwords[0] === passwords [1]
 */
user.passwordMatch = function (passwords, errors, values) {
  var values = values || {};
  var errors = errors || [];
  if(!Array.isArray(passwords) || passwords.length !== 2) throw new Error('invalid function parameters');
  if(passwords[0] === passwords[1]) return true;

  errors.push('passwords don\'t match');
  return false;
};

/**
 * @param {Array.<string>} passwords Array of two strings.
 * @param {Object} [errors={}] Object which will be filled with errors.
 * @param {Object} [values={}] Object which will be given validated value.
 * @returns {boolean}
 */
user.passwords = function (passwords, errors, values) {
  var values = values || {};
  var errors = errors || {};
  if(!Array.isArray(passwords) || passwords.length !== 2) throw new Error('invalid function parameters');

  errors.password = errors.password || [];
  errors.password2 = errors.password2 || [];

  var validRegex = this.password(passwords[0], errors.password);
  var validMatch = this.passwordMatch(passwords, errors.password2);

  return (validRegex && validMatch) ? true : false;
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

exports.user.code = function (code, errors, values) {
  var errors = errors || [];
  var values = values || {};
  values.code = code;

  //validate url 
  var valid = true;
  var regex = /^(?=.{32}$)[a-f0-9]*$/;

  if (!regex.test(code)) {
    errors.push('wrong code format');
    valid = false;
  }

  return valid;
};

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

tag.input = function (tagInput, outputObject) {
  outputObject = outputObject || {};
  
  //split raw tags into an Array
  let rawTags = tagInput ? tagInput.replace(/\s*,?\s*$/,'').split(/\s*,\s*/) : [];
  //set arrays for sorting
  let tags = []; //all tags
  let invalidTags = [];
  let validTags = [];

  var areTagsValid = true;

  //checking if every tag is valid and sorting
  for(let rawTag of rawTags){ 
    let thisValid = this.name(rawTag); 
    if(thisValid === true) validTags.push(rawTag);
    else invalidTags.push(rawTag);
    tags.push(rawTag);

    areTagsValid = areTagsValid && thisValid;
  }

  outputObject.input = tagInput;
  outputObject.tags = {
    valid: validTags,
    invalid: invalidTags,
    all: tags
  };

  return areTagsValid;
};

tag.edit = valiterate(['description']);

tag.create = valiterate(['name', 'description']);

/**
 * Validates text of feedback (length <= 8192)
 *
 */
exports.feedback.text = checkLength (1, 8192, 'feedback text must have 1 - 8192 characters', 'text');
exports.feedback.subject = checkLength (1,256,'subject must have 1 - 256 characters', 'subject');
exports.feedback.context = checkLength (0,512,'subject must have 0 - 512 characters', 'context');
exports.feedback.username = checkLength (0,512,'subject must have 0 - 512 characters', 'username');
exports.feedback.email = function (email, errors, values) {
  errors = errors || [];
  if (!email) {
    values = values || {};
    values.email = null;
    return true;
  }
  else return exports.user.email(email, errors, values);
};

exports.feedback.all = function (data, errors, values) {
  var values = values || {};
  var errors = errors || {};

  var isPublic = data.public === 'public';
  var anonymous = data.anonymous === 'anonymous';
  var logged = data.from.logged === true;
  var username = data.from.username || '';
  //if anonymous is true, we reset username & logged to null & false;
  if(anonymous === true) {
    username = '';
    logged = false;
  }

  //username && logged
  values.from = {};
  var validUsername = this.username(username, errors, values.from);
  values.from.logged = logged;
  var valid5 = valiterate(['email', 'subject', 'context', 'text']).call(this, data, errors, values);
  values.public = isPublic;

  return valid5 && validUsername;
};

/**
 * @param {number} min
 * @param {number} max
 * @param {string} [errorMessage]
 * @returns {function}
 */
function checkLength(min, max, errorMessage, name) {
  var errorMessage = errorMessage || 'string must be '+min+' to '+max+'characters long';
  return function (str, errors, values) {
    var errors = errors || [];

    if(values && name) values[name] = str.substr(0, max);
    
    //validate about (0 - 16384 characters)
    if (str.length > max || str.length < min) {
      errors.push(errorMessage);
      return false;
    }
    return true;
  };
}

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
