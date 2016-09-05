'use strict';

var crypto = require('crypto');

module.exports = {};


module.exports.hashPassword = function hashPassword(password, salt, iterations) {
  return new Promise(function (resolve, reject) {
    crypto.pbkdf2(password, salt, iterations, 64, 'sha256', function(err, key) {
      if (err) reject(err);
      var hash = key.toString('base64');
      resolve(hash);  // 'c5e478d...1469e50'
    });
  });
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
  return new Promise(function (resolve, reject) {
    crypto.randomBytes(64, function (err, bytes) {
      if(err) reject(err);
      var salt = bytes.toString('base64');
      resolve(salt);
    });
  });
};

module.exports.generateHexCode = function (byteNumber) {
  return new Promise(function (resolve, reject) {
    crypto.randomBytes(byteNumber, function (err, bytes) {
      if (err) reject(err);
      var code = bytes.toString('hex');
      resolve(code);
    });
  });
};
