'use strict';

var Q = require('q');
var co = require('co');
var fs = require('fs');
var util = require('util');
var sharp = require('sharp');
var prf = Q.denodeify(fs.readFile); //promisifying fs.readFile function (prf = promise read file)
var pul = Q.denodeify(fs.unlink); //promisifying fs.unlink function (pul = promise read file)

var exports = module.exports = {};
var avatar = exports.avatar = {};

/**
 * @param {string|Buffer} input Path to image or image Buffer.
 * @param {string} username
 *
 */
avatar.create = function (input, username) {
  var avatarOutput = `${__dirname}/../files/img/avatars/${username}.jpg`;

  return co(function * () {
    let data = yield prf(input);
    let image = sharp(data);
    let response = yield image.resize(256,256).jpeg().toFile(avatarOutput);
    yield pul(input);
    return response;
  }).catch(function (e) {
    return pul(input).then(function () {
      throw e;
    });
  });

  /*
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
    })
    .then(null, function (err) {
      pul(input);
      throw err;
    });
  */
};

//reading the avatar picture
avatar.read = function (username) {
  //path to the picture
  var avatarPath = `${__dirname}/../files/img/avatars/${username}.jpg`;
  return co(function * () {
    try {
      //try to read the avatar
      let data = yield prf(avatarPath);
      return {type: 'image/jpeg', data: data};
    }
    catch(e) {
      //otherwise read the fallback image;
      var fallbackPath = `${__dirname}/../files/img/empty-avatar.png`;
      if(e.code === 'ENOENT') {
        let data = yield prf(fallbackPath);
        return {type: 'image/png', data: data}; 
      }
      throw e;
    }
  });
};

avatar.remove = function (username) {
  var avatarPath = `${__dirname}/../files/img/avatars/${username}.jpg`;
  return co(function * () {
    try {
      //unlink the avatar
      yield pul(avatarPath);
      return;
    }
    catch(e) {
      //catch that the avatar doesn't exist
      if(e.code === 'ENOENT') {
        return;
      }
      throw e;
    }
  });
}
