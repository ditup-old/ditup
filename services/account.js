'use strict';

var crypto = require('crypto');
var Q = require('q');

module.exports = {};


module.exports.hashPassword = function hashPassword(password, salt, iterations) {
  var deferred = Q.defer();
  crypto.pbkdf2(password, salt, iterations, 64, 'sha256', function(err, key) {
    if (err) deferred.reject(err);
    var hash = key.toString('base64');
    deferred.resolve(hash);  // 'c5e478d...1469e50'
  });

  return deferred.promise;
};

function constantEquals(x, y) {
  var result = true;
  var length = (x.length > y.length) ? x.length : y.length;
  for(var i=0; i<length; i++) {
    if(x.charCodeAt(i) !== y.charCodeAt(i)) {
      result = false;
    }
  }
  return result;
}

module.exports.compareHashes = function compareHashes(hash1, hash2) {
  return constantEquals(hash1, hash2);
};

module.exports.generateSalt = function generateSalt(){
  var deferred = Q.defer();
  crypto.randomBytes(64, function (err, bytes) {
    if(err) deferred.reject(err);
    var salt = bytes.toString('base64');
    deferred.resolve(salt);
  });
  return deferred.promise;
};

module.exports.generateHexCode = function (byteNumber) {
  var deferred = Q.defer();
  crypto.randomBytes(byteNumber, function (err, bytes) {
    if (err) deferred.reject(err);

    var code = bytes.toString('hex');
    deferred.resolve(code);
  });
  return deferred.promise;
};
