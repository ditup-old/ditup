'use strict';

var Q = require('q');
var path = require('path');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var EmailTemplate = require('email-templates').EmailTemplate;

var config = require('./config.json');


var exports = module.exports = {};
exports.send = {};


var dataNotProvided = new Error('data not provided');

exports.send.general = function (locals) {
  var locals = locals || {};
  locals.email = locals.to || locals.email;
  if(!locals.email) return Q.reject(dataNotProvided);
  var transport = nodemailer.createTransport(smtpTransport(config));

  var psm = function (data) {
    var deferred = Q.defer();
    
    transport.sendMail(data, function (err, response) {
      if(err) return deferred.reject(err);
      return deferred.resolve(response);
    })

    return deferred.promise;
  };

  var emailOptions = {
    from: locals.from ? '<'+locals.from+'>' : 'info@ditup.org <info@ditup.org>',
    to: '<'+locals.email+'>',
    subject: locals.subject,
    html: locals.html,
    text: locals.text
  };

  return psm(emailOptions)
    .then(function (info){
      transport.close();
      return info;
    })
    .then(null, function (err){
      transport.close();
      throw err;
    });
};

exports.send.verifyEmail = function (data) {
  var data = data || {};
  data.email = data.to || data.email;
  if(!data.email || !data.url || !data.username) return Q.reject(dataNotProvided);

  var that = this;

  var templateDir = path.join(__dirname, 'templates', 'verify-email');

  var verify = new EmailTemplate(templateDir);
  //var qvr = Q.denodeify(verify.render);

  var renderData = { username: data.username, url: data.url };
  return verify.render(renderData)
    .then(function (result) {
      var toSend = {
        to: data.email,
        subject: 'email verification for ditup.org',
        html: result.html,
        text: result.text
      };

      return that.general(toSend);
    });
};

exports.send.resetPassword = function (data) {
  var data = data || {};
  data.email = data.to || data.email;
  if(!data.email || !data.url || !data.username) return Q.reject(dataNotProvided);

  var that = this;

  var templateDir = path.join(__dirname, 'templates', 'reset-password');

  var rep = new EmailTemplate(templateDir);
  //var qvr = Q.denodeify(verify.render);

  var renderData = { username: data.username, url: data.url };
  return rep.render(renderData)
    .then(function (result) {
      var toSend = {
        to: data.email,
        subject: 'password reset for ditup.org',
        html: result.html,
        text: result.text
      };

      return that.general(toSend);
    });
};
