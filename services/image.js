'use strict';

var Q = require('q');
var fs = require('fs');
var util = require('util');
var sharp = require('sharp');
var prf = Q.denodeify(fs.readFile); //promisifying fs.readFile function (prf = promise read file)
var pul = Q.denodeify(fs.unlink); //promisifying fs.unlink function (pul = promise read file)

var exports = module.exports = {};
var avatar = exports.avatar = {};

avatar.create = function (input, username) {
  var avatarOutput = __dirname + '/../files/img/avatars/' + username + '.jpg';
  var response;
  return prf(input)
    .then(function (data) {
      var image = sharp(data);
      return image
        .resize(256, 256)
        .jpeg()
        .toFile(avatarOutput);
    })
    .then(function (_response) {
      response = _response;
      return pul(input);
    })
    .then(function () {
      return response;
    });
};

avatar.read = function (username) {

  var avatarPath = __dirname + '/../files/img/avatars/' + username + '.jpg'

  return prf(avatarPath)
    .then(function (data) {
      return {type: 'image/jpeg', data: data}; 
    })
    .then(null, function (err) {
      var fallbackPath = __dirname + '/../files/img/empty-avatar.png';
      if(err.code === 'ENOENT') {
        return prf(fallbackPath)
          .then(function (data) {
            return {type: 'image/png', data: data}; 
          });
      }
      throw err;
    });
  /*fs.readFile(, function (err, data){
    if(err === null) {
      return deferred.resolve({type: 'image/jpeg', data: data}); 
    }
    else if(err.code === 'ENOENT') {
      fs.readFile(__dirname+'/../files/img/empty-avatar.png', function (err, data) { 
        if(err) return deferred.reject(err); 
     yy   return deferred.resolve({type: 'image/png', data: data}); 
      }); 
    }
    else return deferred.reject(err);
  }); 
  return deferred.promise; 
  */
};


/* untested code for lwip
var lwip = require('lwip');

exports.avatar = function (input, output) {
  var deferred = Q.defer();
  lwip.open(input, function(err, image){
    // check err...
    if(err) return deferred.reject(err);

    // define a batch of manipulations and save to disk as JPEG:
    var square = Math.min(image.width(), image.height());
    image.batch()
      .crop(square, square)
      .resize(256, 256)
      .writeFile(output, function(err){
        if(err) return deferred.reject(err);
        return deferred.resolve();
      });
  });
  return deferred.promise;
};

*/
