'use strict';

var marked = require('marked');

var dit = {};
var tag = {};
var user = {};

var exports = module.exports = {
  user: user,
  dit: dit,
  tag: tag
};

user.profile = function (userData) {
  var profile = {};
  //age
  profile.age = userData.profile.birthday instanceof Date ? '' + countAge(userData.profile.birthday) + ' years old' : '' ;
  //gender
  profile.gender = (userData.profile.gender != '' && userData.profile.gender != 'unspecified') ? userData.profile.gender : '';
  //joined
  var joinDate = userData.account.join_date;
  let active = userData.account.active;
  profile.joined = `joined ${countPastTime(joinDate)}`;
  profile.active = `active ${countPastTime(active)}`;
  //last login
  profile.lastLogin = 'Logged ' + countPastTime(userData.account.last_login) + '.';
  //name
  profile.name = userData.profile.name + ' ' + userData.profile.surname;
  //username
  profile.username = userData.username;
  //about
  profile.about = marked(userData.profile.about);
  return profile;
};

user.profileEdit = function (userData) {
  var deferred = Q.defer();
  process.nextTick(function(){
    var profile = {};
    //age
    var brthDate = userData.profile.birthday;
    var birthday = (brthDate === null) ? '' : brthDate;
    profile.birthday = birthday;
    //gender
    profile.gender = userData.profile.gender === 'unspecified' ? null : userData.profile.gender;
    //name
    profile.name = userData.profile.name;
    //surname
    profile.surname = userData.profile.surname;
    //about
    profile.about = userData.profile.about;
    profile.username = userData.username;
    deferred.resolve(profile);
  });
  return deferred.promise;
};

user.settings = function (user) {
  var settings = user.settings || {};
  return Q.resolve({
    username: user.username,
    settings: {
      view: settings.view || 'all'
    },
    email: user.email,
    isEmailVerified: user.account.email.verified
  });
};

var months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

tag.view = tag.edit = function (tag) {
  return tag;
};

function countAge(dateString) {
  //http://stackoverflow.com/a/7091965
  var today = new Date();
  var birthDate = new Date(dateString);
  var age = today.getFullYear() - birthDate.getFullYear();
  var m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    --age;
  }
  return age;
}

function countPastTime(timestamp) {
  if (!timestamp) return 'never'
  var sec = Math.floor((Date.now() - timestamp)/1000);
  if (sec === 0) return 'right now';

  if(sec<60) return '' + sec + ' second' + (sec>1 ? 's' : '') + ' ago';
  var min = Math.floor(sec/60);
  if(min<60) return '' + min + ' minute' + (min>1 ? 's' : '') + ' ago';
  var hour = Math.floor(min/60);
  if(hour<24) return '' + hour + ' hour' + (hour>1 ? 's' : '') + ' ago';
  var day = Math.floor(hour/24);
  if(day<7) return '' + day + ' day' + (day>1 ? 's' : '') + ' ago';
  else if(day<30) {
    var week = Math.floor(day/7);
    return '' + week + ' week' + (week>1 ? 's' : '') + ' ago';
  }
  else if(day<365) {
    var month = Math.floor(day/30);
    return `${month} ' month'${month>1 ? 's' : ''} ago`;
  }
  else {
    var year = Math.floor(day/365);
    return '' + year + ' year' + (year>1 ? 's' : '') + ' ago';
  }
}

module.exports.cpt = countPastTime;
