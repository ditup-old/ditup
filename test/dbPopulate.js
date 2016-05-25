'use strict';

module.exports = function (db) {
  var data = {};
  var modules = ['user', 'tag', 'discussion', 'challenge'/*, 'idea', 'project'*/];


  for (let md of modules) {
    data[md] = require('../services/data/'+md)(db);
  }

  
  var dependencies = (function () {
    var validate = require('../services/validation');
    var database = require('../services/independentData')({db: db});
    var accountService = require('../services/account');
    var accountConfig = require('../config/user/account.json');

    var independentAccount = require('../modules/independentAccount');

    var dependencies = {
      validate: validate,
      database: database,
      accountService: accountService,
      accountConfig: accountConfig
    };

    return dependencies;
  })();

  data.createUser = require('../modules/independentAccount')(dependencies).createUser;

  /**
   * 
   *
   */
  function populate(dbData) {
    //put dbData to database
    //create users
    function populateUsers(users) {
      var userPromises = [];

      for(let i = 0, len = users.length; i<len; ++i) {
        var userData = {
          username: users[i].username,
          password: users[i].password,
          password2: users[i].password,
          email: users[i].email
        };
        var cu = data.createUser(userData)
          .then(function () {
            return data.user.updateEmailVerified({username: userData.username}, {verifyDate: Date.now(), verified: true})
          });
        userPromises.push(cu);
      }

      return Promise.all(userPromises)
        .then(function () {});
    }

    function populateTags(tags, users) {
      var tagPromises = [];
      for(let i = 0, len = tags.length; i < len; ++i) {
        let creator = typeof(tags[i].creator) === 'number' ? users[tags[i].creator].username : tags[i].creator;
        tags[i].creator = creator;
        let tp = data.tag.create({
          name: tags[i].name,
          description: tags[i].description,
          meta: {
            created: Date.now(),
            creator: creator
          }
        });
        tagPromises.push(tp);
      }
      return Promise.all(tagPromises)
        .then(function () {});
    }

    function populateChallenges(challenges, users) {
      var challengePromises = [];
      for(let i = 0, len = challenges.length; i < len; ++i) {
        let creator = typeof(challenges[i].creator) === 'number' ? users[challenges[i].creator].username : challenges[i].creator;
        challenges[i].creator = creator;
        let cp = data.challenge.create({
          name: challenges[i].name,
          description: challenges[i].description,
          creator: creator
        });
        challengePromises.push(cp);
      }
      return Promise.all(challengePromises)
        .then(function (_ids) {
          //copying the ids of the newly saved challenges into the original challenge object (for further use)
          
          for(let i=0, len = _ids.length; i<len; ++i) {
            challenges[i].id = _ids[i].id;
          }

          return;
        });
    }

    function populateChallengeTag(challengeTag, challenges, tags, users) {
      var ctPromises = [];
      for(let _ct of challengeTag) {
        let creator = typeof(_ct.creator) === 'number' ? users[_ct.creator].username : _ct.creator;
        let challenge = challenges[_ct.challenge].id;
        let tag = typeof(_ct.tag) === 'number' ? tags[_ct.tag].name : _ct.tag;
        let ctp = data.challenge.addTag(challenge, tag, creator);
        ctPromises.push(ctp);
      }
      return Promise.all(ctPromises)
        .then(function () {
          for(let _ct of challengeTag) {
            let tagsArray = challenges[_ct.challenge].tags = challenges[_ct.challenge].tags || [];
            let tag = typeof(_ct.tag) === 'number' ? tags[_ct.tag].name : _ct.tag;
            tagsArray.push(tag);
          }
          return;
        });
    
    }

    function populateChallengeCommentAuthor(challengeCommentAuthor, challenges, users) {
      var ccaPromises = [];
      for(let _cca of challengeCommentAuthor) {
        let author = typeof(_cca.author) === 'number' ? users[_cca.author].username : _cca.author;
        let challenge = challenges[_cca.challenge];
        let ccap = data.challenge.addComment(challenge.id, {text: _cca.text}, author);

        //update the data object with challenge comments
        challenge.comments = challenge.comments || [];
        challenge.comments.push({text: _cca.text, author: author});


        ccaPromises.push(ccap);
      }
      return Promise.all(ccaPromises)
        .then(function () {
          return;
        });
    
    }

    return populateUsers(dbData.users)
      .then(function () {
        return populateTags(dbData.tags, dbData.users);
      })
      .then(function () {
        return populateChallenges(dbData.challenges, dbData.users);
      })
      .then(function () {
        return populateChallengeTag(dbData.challengeTag, dbData.challenges, dbData.tags, dbData.users);
      })
      .then(function () {
        return populateChallengeCommentAuthor(dbData.challengeCommentAuthor, dbData.challenges, dbData.users);
      })
      .then(function () {
        // console.log(dbData);
      });
  }
  
  /**
   * it promises to clear all the data from database
   *
   *
   */
  function clear(dbData) {
    let promises = [];
    for(let collectionName in dbData) {
      promises.push(db.query('FOR c IN ' + collectionName + ' REMOVE c IN ' + collectionName, {}));
    }

    return Promise.all(promises)
      .then(function () {
        return;
      });
  }

  return {
    populate: populate,
    clear: clear
  };
};
