'use strict';

var Q = require('q');
var fs = require('fs');
var FOLDER = '../files';
var EXT = ['png', 'jpg'];

function readAvatar(username) {
  var deferred = Q.defer();

  
  
  var path = FOLDER + 'img/avatar/' + username + '.' +EXT[0];

  fs.readFile('../files/img/empty-avatar.png', function (err, data) {
    if(err) return deferred.reject(JSON.stringify(err));
    return deferred.resolve({type: 'image/png', data: data});
  });
  return deferred.promise;
}

var getErrorImage = function () {
  var deferred = Q.defer();
  fs.readFile(__dirname+'/../../../files/img/404.png', function (err, data) {
    console.log('finished');
    if(err) return deferred.reject(JSON.stringify(err));
    console.log('success');
    return deferred.resolve({type: 'image/png', data: data});
  });
  console.log('getting error image');
  return deferred.promise;
}

