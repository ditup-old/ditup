'use strict';

module.exports = function (db) {
  var data = {};
  var modules = ['user', 'tag', 'discussion', 'challenge', 'idea'/*, 'project'*/];


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

    function populateCollections(collections, users, collectionName) {
      var challenges = collections;
      var challengePromises = [];
      for(let i = 0, len = challenges.length; i < len; ++i) {
        let creator = typeof(challenges[i].creator) === 'number' ? users[challenges[i].creator].username : challenges[i].creator;
        challenges[i].creator = creator;
        let cp = data[collectionName].create({
          name: challenges[i].name,
          description: challenges[i].description,
          topic: challenges[i].topic,
          creator: creator
        });
        challengePromises.push(cp);
      }
      return Promise.all(challengePromises)
        .then(function (_ids) {
          //copying the ids of the newly saved challenges into the original challenge object (for further use)
          
          for(let i=0, len = _ids.length; i<len; ++i) {
            challenges[i].id = _ids[i].id;
            challenges[i].tags = challenges[i].tags || [];
          }

          return;
        });
    }

    function populateCollectionTag(collectionTag, collections, tags, users, collectionName) {
      var challengeTag = collectionTag;
      var challenges = collections;
      var ctPromises = [];
      for(let c of collections){
        c.tags = [];
      }
      for(let _ct of challengeTag) {
        let creator = typeof(_ct.creator) === 'number' ? users[_ct.creator].username : _ct.creator;
        let challenge = challenges[_ct[collectionName]].id;
        let tag = typeof(_ct.tag) === 'number' ? tags[_ct.tag].name : _ct.tag;
        let ctp = data[collectionName].addTag(challenge, tag, creator);
        ctPromises.push(ctp);
      }
      return Promise.all(ctPromises)
        .then(function () {
          for(let _ct of challengeTag) {
            let tagsArray = challenges[_ct[collectionName]].tags = challenges[_ct[collectionName]].tags || [];
            let tag = typeof(_ct.tag) === 'number' ? tags[_ct.tag].name : _ct.tag;
            tagsArray.push(tag);
          }
          return;
        });
    
    }

    function populateCollectionCommentAuthor(collectionCommentAuthor, collections, users, collectionName) {
      var challengeCommentAuthor = collectionCommentAuthor;
      var challenges = collections;
      var ccaPromises = [];
      for(let c of collections) {
        c.comments = [];
      }
      for(let _cca of challengeCommentAuthor) {
        let author = typeof(_cca.author) === 'number' ? users[_cca.author].username : _cca.author;
        let challenge = challenges[_cca[collectionName]];
        let ccap = data[collectionName].addComment(challenge.id, {text: _cca.text}, author);

        //update the data object with challenge comments
        challenge.comments = challenge.comments || [];
        challenge.comments.push({text: _cca.text, author: author});


        ccaPromises.push(ccap);
      }
      return Promise.all(ccaPromises)
        .then(function (ccaps) {
          for(let i=0, len=ccaps.length; i<len; ++i) {
            let cca = collectionCommentAuthor[i];
            cca.author = typeof(cca.author) === 'number' ? users[cca.author].username : cca.author;
            //cca[collectionName] = {id: collections[cca[collectionName]].id};
            cca.id = ccaps[i].id;
            let challenge = challenges[cca[collectionName]];
            challenge.comments[i].id = ccaps[i].id;
          }
          return;
        });
    
    }

    return populateUsers(dbData.users)
      .then(function () {
        return populateTags(dbData.tags, dbData.users);
      })
      .then(function () {
        //populate challenges
        return populateCollections(dbData.challenges, dbData.users, 'challenge');
      })
      .then(function () {
        return populateCollectionTag(dbData.challengeTag, dbData.challenges, dbData.tags, dbData.users, 'challenge');
      })
      .then(function () {
        return populateCollectionCommentAuthor(dbData.challengeCommentAuthor, dbData.challenges, dbData.users, 'challenge');
      })
      .then(function () {
        //populate discussions
        return populateCollections(dbData.discussions, dbData.users, 'discussion');
      })
      .then(function () {
        return populateCollectionTag(dbData.discussionTag, dbData.discussions, dbData.tags, dbData.users, 'discussion');
      })
      .then(function () {
        return populateCollectionCommentAuthor(dbData.discussionCommentAuthor, dbData.discussions, dbData.users, 'discussion');
      })
      .then(function () {
        //populate ideas
        return populateCollections(dbData.ideas, dbData.users, 'idea');
      })
      .then(function () {
        return populateCollectionTag(dbData.ideaTag, dbData.ideas, dbData.tags, dbData.users, 'idea');
      })
      .then(function () {
        return populateCollectionCommentAuthor(dbData.ideaCommentAuthor, dbData.ideas, dbData.users, 'idea');
      })
      .then(function () {
        //console.log(dbData);
      });
  }
  
  /**
   * it promises to clear all the data from database
   *
   *
   */
  function clear() {
    /*
    let promises = [];
    for(let collectionName in dbData) {
      promises.push(db.query('FOR c IN ' + collectionName + ' REMOVE c IN ' + collectionName, {}));
    }

    return Promise.all(promises)
      .then(function () {
        return;
      });
    */
    return db.truncate()
      .then(function () {
        return;
      });
  }

  return {
    populate: populate,
    clear: clear
  };
};
