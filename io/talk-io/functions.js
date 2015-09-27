'use strict';

var mongoose = require('mongoose');
var TalkModel = require('../../models/talk');
var UserModel = require('../../models/user');
var Q = require('q');

var getTalks = function (username, params) {
  console.log('getting talks');
  var deferred = Q.defer();
  
  UserModel.find({username: username}).exec()
    .then(function (users) {
      if(users.length == 0 || users.length > 1)
        deferred.reject('there is different number of users than expected');
      var userId=users[0]._id;
      console.log('user_id', userId);
      return TalkModel.find({'participants.users.id': userId})
        .sort('-messages.sent')
        .limit(5)
        .populate({path: 'participants.users.id', model: 'User', select: 'username -_id'})
        .populate({path: 'messages.from', model: 'User', select: 'username -_id'})
        //.populate('participants.dits', 'url')
        .exec();
    },
    function (err) {
      console.log(err);
      return deferred.reject(err);
    })
    .then(function (talks) {
      console.log('here the talks', talks);
      deferred.resolve(talks);
      return talks;
    });

  return deferred.promise;
};

module.exports = 
{
  getTalks: getTalks,
  processTalks: processTalks,
  validateNewTalk: function (data) {
    console.log('validating')
    return Q.resolve('asdf');
  },
  saveNewTalk: saveNewTalk,
  getTalk: getTalk,
  processTalk: processTalk,
  saveMessage: saveMessage,
  setTalkViewed: setTalkViewed
};

function saveMessage(data, sender){
  var deferred = Q.defer();
  console.log('saving msg', data);
  UserModel.findOne({username: sender.username}).exec()
    .then(function (user) {
      //console.log(user)
      return TalkModel
        .findByIdAndUpdate(
          base64ToHex(data.talk), {
            $push: {
              'messages': {text: data.msg, from: user._id},
            }
          },
          {safe: true, upsert: true, new : true}
        )
        .populate({path: 'messages.from', model: 'User', select: 'username -_id'})
        .exec();
 
    }, function (err) {console.log(err)})
    .then(function (object) {
      var mesg = object.messages[object.messages.length-1];
      console.log(mesg);
      deferred.resolve(mesg);
    });
  return deferred.promise;
}

function saveNewTalk(data) {
  var deferred = Q.defer();
  console.log('saving');
  //data={array of usernames, array of dit urls}
  var myId, userIds = [];

  Q(UserModel.find({username: data.me}, '_id').exec())
    .then(function (_myId) {
      console.log('hello', _myId[0]._id.constructor);
//        myId = mongoose.Types.ObjectId(_myId[0]._id);
      myId = _myId[0]._id;
      console.log('myId',myId);
      return UserModel.find({
        'username': { $in: data.usernames}
      }, '_id').exec();
    })
    .then(function (_userIds){
      var deferred_ = Q.defer();
      console.log('ids',_userIds);
      for(var i=0, len=_userIds.length; i<len; i++){
        userIds.push(String(_userIds[i]._id));
        //userIds.push(mongoose.Types.ObjectId(_userIds[i]._id));
      }
      console.log('indexofmyid', userIds.indexOf(String(myId)));
      if(userIds.indexOf(String(myId)) === -1) userIds.push(String(myId));
      var usersWhole = [];
      for(var i=0, len=userIds.length; i<len; i++){
        usersWhole.push({
          id: mongoose.Types.ObjectId(userIds[i]),
          viewed: String(userIds[i]) === String(myId) ? true : false
        });
      }
      console.log(userIds);
      var newTalk = new TalkModel({
        participants: {
          users: usersWhole,
          dits: []
        },
        messages: [{
          from: myId,
          text: data.message
        }]
      });
      newTalk.save(function(err, nu){
        if(err) deferred_.reject(err);
        deferred_.resolve({id: nu._id});
      });
      return deferred_.promise;
    })
    .then(getTalk)
    .then(function (talk) {
      deferred.resolve(talk);
    })
    .catch(function(e){
      console.log(e);
      return deferred.reject(e);
    });
  return deferred.promise;
}

function getTalk (talk) {
  var deferred = Q.defer();
  talk.id = talk.id || base64ToHex(talk.url);
  TalkModel
    .findOne({_id: mongoose.Types.ObjectId(talk.id)})
    .populate({path: 'participants.users.id', model: 'User', select: 'username -_id'})
    .populate({path: 'messages.from', model: 'User', select: 'username -_id'})
    .exec()
    .then(function (tk) {
      return deferred.resolve(tk);
    });
    //.catch(function (err) {
    //  return deferred.reject(err);
    //});

  return deferred.promise;
}

function processTalk(talk, session) {
  var deferred = Q.defer();

  process.nextTick(function () {
    var usrs = [];
    var dits = [];
    var messages = [];
    var viewed = false;
    
    var tpu = talk.participants.users;
    for (var j = 0, len = tpu.length; j < len; j++) {
      if (tpu[j].id.username === session.username) {
        if(tpu[j].viewed === true) viewed = true;
      }
      usrs.push({
        username: tpu[j].id.username
      });
    }

    var tpd = talk.participants.dits;
    for (var j = 0, len = tpd.length; j < len; j++) {
      dits.push({
        url: tpd[j].url
      });
    }

    var tm = talk.messages;
    for (var i = 0, len = tm.length; i < len; i++) {
      var msg = tm[i];
      messages.push({
        from: {username: msg.from.username},
        text: msg.text,
        sent: msg.sent
      });
    }


    var processed = {
      url: hexToBase64(talk.id),//new Buffer(tk.id, 'base64')
      viewed: viewed, //boolean. did the user view the talk?
      participants: {
        users: usrs,
        dits: dits
      },
      messages: messages
    };

    deferred.resolve(processed);
  });
  
  return deferred.promise;
}

function processTalks(talks, session) {
  var deferred = Q.defer();

  process.nextTick(function () {
    var processed = [];
    for (var i=0, len=talks.length; i<len; i++){
      var tk = talks[i];
      var usrs = [];
      var dits = [];
      var viewed = false;
      var lastMessage = tk.messages[tk.messages.length-1];
      
      for (var j = 0, len2 = tk.participants.users.length; j < len2; j++) {
        //console.log(JSON.stringify(tk.participants.users[j]));
        var uussr = tk.participants.users[j];
        usrs.push({
          username: uussr.id.username
        });
        if (session.logged === true && uussr.id.username === session.username && uussr.viewed === true) {
          viewed = true;
        }
      }

      for (var j = 0, len2 = tk.participants.dits.length; j < len2; j++) {
        dits.push({
          url: tk.participants.dits[j].url,
        });
      }

      processed.push({
        url: hexToBase64(tk.id),//new Buffer(tk.id, 'base64')
        viewed: viewed, //boolean. did the user view the talk?
        participants: {
          users: usrs,
          dits: dits
        },
        lastMessage: lastMessage
      });
    }
    deferred.resolve(processed);
  });

  return deferred.promise;
}

function setTalkViewed(value, talkUrl, userId) {
  var talkId = base64ToHex(talkUrl);
  var deferred = Q.defer();
//value = bool (set viewed to true or false?)
  TalkModel.update({_id: talkId, 'participants.users.id': userId}, {'$set':{'participants.users.$.viewed':value}}, function (err, retVal){
    console.log(err, retVal);
    if (err) deferred.reject(err);
    deferred.resolve(retVal);
  });
  return deferred.promise;
}


function hexToBase64(hex) {
  return (new Buffer(hex, 'hex')).toString('base64');
}

function base64ToHex(base64) {
  return (new Buffer(base64, 'base64')).toString('hex');
}
