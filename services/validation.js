'use strict';

//this service strictly validates form of the fields. no database access.

var signup = {};
var user = {};
var dit = {};
var tag = {};

module.exports = {
  signup : signup,
  user: user,
  dit: dit,
  tag: tag
};

signup.username = function (username, errors) {
  var errors = errors || [];
  //username regex
  var usernameRegex = /^(?=.{2,32}$)[a-z0-9]+([_\-\.][a-z0-9]+)*$/;

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

user.name = signup.name = function (name, errors, values) {
  var errors = errors || [];
  var values = values || {};
  //name, surname max 128 characters long
  values.name = name;
  if(name.length <= 128) return true;

  errors.push('name can be max 128 characters long');
  return false;
};

user.surname = signup.surname = function (surname, errors, values) {
  var errors = errors || [];
  var values = values || {};
  values.surname = surname;
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

user.profile = function (profileData, errors, values) {
  var errors = errors || {};
  var values = values || {};
  //birthday, name, surname, gender, about

  var fields = ['name', 'surname', 'gender', 'birthday', 'about'];
  
  var valid = true;
  for(var i = 0, len = fields.length; i<len; i++){
    var field = fields[i];
    errors[field] = errors[field] || [];
    valid = user[field](profileData[field], errors[field], values) && valid;
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

//here we validate user view settings (who has rights to view dit?)
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
    for(var i = 0, len = fields.length; i<len; i++){
      var field = fields[i];
      errors[field] = errors[field] || [];
      valid = this[field](data[field], errors[field], values) && valid;
    }
    
    return valid;
  };
}
