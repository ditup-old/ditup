'use strict';

var Q = require('q');

var dit = {};
var tag = {};
var user = {};

var exports = module.exports = {
  user: user,
  dit: dit,
  tag: tag
};

user.profile = function (userData) {
  var deferred = Q.defer();
  console.log('userData', userData);
  process.nextTick(function(){
    
    var profile = {};
    //age
    profile.age = userData.profile.birthday instanceof Date ? '' + countAge(userData.profile.birthday) + ' years old' : '' ;
    //gender
    profile.gender = (userData.profile.gender != '' && userData.profile.gender != 'unspecified') ? userData.profile.gender : '';
    //joined
    var joinDate = userData.account.join_date;
    profile.joined = 'Joined ' + countPastTime(joinDate) + '.';
    //last login
    profile.lastLogin = 'Logged ' + countPastTime(userData.account.last_login) + '.';
    //name
    profile.name = userData.profile.name + ' ' + userData.profile.surname;
    //username
    profile.username = userData.username;
    //about
    profile.about = userData.profile.about;

    deferred.resolve(profile);
  });
  console.log('processing data');
  return deferred.promise;
};

user.profileEdit = function (userData) {
  var deferred = Q.defer();
  process.nextTick(function(){
    var profile = {};
    //age
    var brthDate = userData.profile.birthday;
    //console.log(typeof(brthDate), typeof(null), brthDate instanceof Date);
    //var birth = (brthDate instanceof Date) ? {
    //  month: brthDate.getUTCMonth()+1,
    //  day: brthDate.getUTCDate(),
    //  year: brthDate.getUTCFullYear()
    //} : null;
    var birthday = (brthDate === null) ? '' : brthDate;//birth.year+'-'+ (birth.month<10?'0':'') +birth.month+'-'+ (birth.day<10?'0':'')+birth.day;
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
    console.log(profile);
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

dit.profile = dit.profileEdit = function (dit) {
  return Q.resolve({
    url: dit.url,
    dittype: dit.dittype || 'dit',
    created: 'Joined ' + countPastTime(dit.created) + '.',
    name: dit.profile.name,
    summary: dit.profile.summary,
    about: dit.profile.about,
    activity: 'activity should be an array of latest actions to feed...'
  });
};

dit.settings = function (dit) {
  return Q.resolve({
    url: dit.url,
    dittype: dit.dittype,
    settings: {
      view: dit.settings.view,
      edit: dit.settings.edit
    }
  });
};

dit.users = function (users) {
  var response = [];

  for (var i = 0, len = users.length; i < len; i++){
    var user = {};
    user.profile = users[i].user.profile;
    user.username = users[i].user.username;
    response.push({user: user, relation: users[i].relation});
  }

  return response;
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
    age--;
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
    return '' + month + ' month' + (month>1 ? 's' : '') + ' ago';
  }
  else {
    var year = Math.floor(day/365);
    return '' + year + ' year' + (year>1 ? 's' : '') + ' ago';
  }
}
